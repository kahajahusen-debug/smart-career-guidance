import uuid
import logging
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional
from fastapi import HTTPException, status

from app.core.database import db, in_memory_store
from app.services.ai_service import generate_interview_questions, evaluate_interview_answer
from app.services.career_assistant_service import get_user_full_context

logger = logging.getLogger("uvicorn")

VALID_INTERVIEW_TYPES = ["Technical", "HR", "Behavioral", "Mixed"]
VALID_DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"]
VALID_QUESTION_COUNTS = [5, 10, 15]

async def start_interview_session(
    user_id: str,
    target_career: Optional[str] = None,
    interview_type: str = "Technical",
    difficulty: str = "Intermediate",
    total_questions: int = 5
) -> Dict[str, Any]:
    """Initialize a new interview prep session with dynamically generated questions."""
    # 1. Fetch user context
    context = await get_user_full_context(user_id)

    chosen_career = target_career.strip() if (target_career and target_career.strip()) else context.get("target_career", "Full Stack Software Engineer")
    
    # Standardize inputs
    itype = interview_type.capitalize() if interview_type.capitalize() in VALID_INTERVIEW_TYPES else "Technical"
    diff = difficulty.capitalize() if difficulty.capitalize() in VALID_DIFFICULTIES else "Intermediate"
    q_count = total_questions if total_questions in VALID_QUESTION_COUNTS else 5

    # 2. Dynamically generate questions
    questions = await generate_interview_questions(
        target_career=chosen_career,
        interview_type=itype,
        difficulty=diff,
        count=q_count,
        user_context=context
    )

    session_id = f"int_{uuid.uuid4().hex[:12]}"
    now_iso = datetime.now(timezone.utc).isoformat()

    session_doc = {
        "session_id": session_id,
        "user_id": user_id,
        "target_career": chosen_career,
        "interview_type": itype,
        "difficulty": diff,
        "total_questions": q_count,
        "current_question": 1,
        "questions": questions,
        "total_score": 0,
        "max_score": q_count,
        "score_display": f"0/{q_count}",
        "correct_count": 0,
        "partially_correct_count": 0,
        "incorrect_count": 0,
        "percentage": 0.0,
        "overall_score": None,
        "status": "In Progress",
        "started_at": now_iso,
        "completed_at": None,
        "performance_summary": None
    }

    if db.is_connected and db.db is not None:
        await db.db.interview_sessions.insert_one(session_doc.copy())
    else:
        in_memory_store.setdefault("interview_sessions", {})
        in_memory_store["interview_sessions"][session_id] = session_doc.copy()

    return session_doc

async def get_interview_session(user_id: str, session_id: str) -> Dict[str, Any]:
    """Retrieve an interview session by ID, enforcing user isolation."""
    session = None
    if db.is_connected and db.db is not None:
        session = await db.db.interview_sessions.find_one({"session_id": session_id}, {"_id": 0})
    else:
        session = in_memory_store.get("interview_sessions", {}).get(session_id)

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Interview session '{session_id}' not found."
        )

    if session.get("user_id") != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You do not own this interview session."
        )

    return session

async def submit_interview_answer(user_id: str, session_id: str, answer: str) -> Dict[str, Any]:
    """Submit answer for current question in session, evaluate with AI, and advance session state."""
    session = await get_interview_session(user_id=user_id, session_id=session_id)

    if session.get("status") == "Completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This interview session is already completed."
        )

    curr_idx = session.get("current_question", 1) - 1
    questions = session.get("questions", [])

    if curr_idx < 0 or curr_idx >= len(questions):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid current question index for this interview session."
        )

    target_q = questions[curr_idx]
    clean_answer = answer.strip() if answer else ""

    # Evaluate answer with AI service
    eval_res = await evaluate_interview_answer(
        question=target_q.get("question", ""),
        user_answer=clean_answer,
        target_career=session.get("target_career", ""),
        difficulty=session.get("difficulty", "")
    )

    # Update question data
    target_q["answer"] = clean_answer
    target_q["status"] = eval_res.get("status", "Partially Correct")
    target_q["score"] = eval_res.get("score", 0.5)
    target_q["feedback"] = eval_res.get("feedback", "")
    target_q["missing_points"] = eval_res.get("missing_points", [])
    target_q["expected_answer"] = eval_res.get("expected_answer", "")
    target_q["model_answer"] = eval_res.get("expected_answer", "")
    target_q["strengths"] = eval_res.get("strengths", [])
    target_q["improvements"] = eval_res.get("missing_points", [])

    questions[curr_idx] = target_q
    session["questions"] = questions

    # Calculate dynamic scores across all answered questions
    scored_q = [q for q in questions if q.get("score") is not None]
    total_score = sum(q.get("score", 0.0) for q in scored_q)
    clean_total = int(total_score) if total_score.is_integer() else round(total_score, 1)
    max_score = session.get("total_questions", len(questions))

    correct_count = sum(1 for q in scored_q if q.get("status") == "Correct")
    partial_count = sum(1 for q in scored_q if q.get("status") == "Partially Correct")
    incorrect_count = sum(1 for q in scored_q if q.get("status") == "Incorrect")
    percentage = round((total_score / max_score) * 100, 1) if max_score > 0 else 0.0

    session["total_score"] = clean_total
    session["max_score"] = max_score
    session["score_display"] = f"{clean_total}/{max_score}"
    session["correct_count"] = correct_count
    session["partially_correct_count"] = partial_count
    session["incorrect_count"] = incorrect_count
    session["percentage"] = percentage
    session["overall_score"] = percentage

    # Advance current_question pointer
    next_question_num = session["current_question"] + 1
    session["current_question"] = next_question_num

    # Check if session completed
    if next_question_num > session["total_questions"] or len(scored_q) >= session["total_questions"]:
        session["status"] = "Completed"
        session["completed_at"] = datetime.now(timezone.utc).isoformat()

        # Categorize areas to improve across session
        areas_to_improve = []
        for q in questions:
            if q.get("status") in ["Partially Correct", "Incorrect"]:
                missing = q.get("missing_points", [])
                for m in missing[:2]:
                    if m and m not in areas_to_improve:
                        areas_to_improve.append(m)
        if not areas_to_improve:
            areas_to_improve = ["Keep practicing advanced system design and real-world edge cases."]

        if percentage >= 80:
            perf_tier = "Excellent"
            overall_perf = f"Outstanding performance! You scored {clean_total}/{max_score} ({percentage}%). You demonstrated strong technical precision and clarity."
        elif percentage >= 60:
            perf_tier = "Good"
            overall_perf = f"Solid performance! You scored {clean_total}/{max_score} ({percentage}%). Good conceptual understanding with minor areas to refine."
        else:
            perf_tier = "Needs Practice"
            overall_perf = f"Practice recommended. You scored {clean_total}/{max_score} ({percentage}%). Focus on reviewing core definitions, syntax, and structured explanations."

        session["performance_summary"] = {
            "total_score": clean_total,
            "max_score": max_score,
            "score_display": f"{clean_total}/{max_score}",
            "percentage": percentage,
            "correct_count": correct_count,
            "partially_correct_count": partial_count,
            "incorrect_count": incorrect_count,
            "performance_tier": perf_tier,
            "overall_performance": overall_perf,
            "areas_to_improve": areas_to_improve[:4],
            "strengths": [f"Correctly answered {correct_count} question(s) with solid domain knowledge."] if correct_count > 0 else ["Completed the interview session practice."],
            "improvements": areas_to_improve[:4],
            "recommended_topics": areas_to_improve[:3]
        }

    # Save updated session
    update_fields = {
        "questions": session["questions"],
        "current_question": session["current_question"],
        "status": session["status"],
        "total_score": session.get("total_score"),
        "max_score": session.get("max_score"),
        "score_display": session.get("score_display"),
        "correct_count": session.get("correct_count"),
        "partially_correct_count": session.get("partially_correct_count"),
        "incorrect_count": session.get("incorrect_count"),
        "percentage": session.get("percentage"),
        "overall_score": session.get("overall_score"),
        "completed_at": session.get("completed_at"),
        "performance_summary": session.get("performance_summary")
    }

    if db.is_connected and db.db is not None:
        await db.db.interview_sessions.update_one(
            {"session_id": session_id},
            {"$set": update_fields}
        )
    else:
        in_memory_store.setdefault("interview_sessions", {})
        in_memory_store["interview_sessions"][session_id] = session.copy()

    return {
        "success": True,
        "evaluation": eval_res,
        "session": session
    }

async def get_interview_history(user_id: str) -> List[Dict[str, Any]]:
    """Get list of interview sessions for authenticated user."""
    sessions = []
    if db.is_connected and db.db is not None:
        cursor = db.db.interview_sessions.find({"user_id": user_id}, {"_id": 0}).sort("started_at", -1)
        sessions = await cursor.to_list(length=100)
    else:
        all_s = in_memory_store.get("interview_sessions", {}).values()
        user_s = [s for s in all_s if s.get("user_id") == user_id]
        user_s.sort(key=lambda x: x.get("started_at", ""), reverse=True)
        sessions = user_s

    return sessions

async def delete_interview_history(user_id: str) -> Dict[str, Any]:
    """Delete all interview sessions for authenticated user."""
    if db.is_connected and db.db is not None:
        res = await db.db.interview_sessions.delete_many({"user_id": user_id})
        deleted_count = res.deleted_count
    else:
        store = in_memory_store.get("interview_sessions", {})
        to_del = [k for k, v in store.items() if v.get("user_id") == user_id]
        for k in to_del:
            del store[k]
        deleted_count = len(to_del)

    return {
        "success": True,
        "message": f"Successfully deleted {deleted_count} interview session(s).",
        "deleted_count": deleted_count
    }

async def finish_interview_session(user_id: str, session_id: str) -> Dict[str, Any]:
    """Explicitly finish an interview session early."""
    session = await get_interview_session(user_id=user_id, session_id=session_id)
    if session.get("status") != "Completed":
        questions = session.get("questions", [])
        scored_q = [q for q in questions if q.get("score") is not None]
        total_score = sum(q.get("score", 0.0) for q in scored_q)
        clean_total = int(total_score) if total_score.is_integer() else round(total_score, 1)
        max_score = session.get("total_questions", len(questions))

        correct_count = sum(1 for q in scored_q if q.get("status") == "Correct")
        partial_count = sum(1 for q in scored_q if q.get("status") == "Partially Correct")
        incorrect_count = sum(1 for q in scored_q if q.get("status") == "Incorrect")
        percentage = round((total_score / max_score) * 100, 1) if max_score > 0 else 0.0

        session["status"] = "Completed"
        session["completed_at"] = datetime.now(timezone.utc).isoformat()
        session["total_score"] = clean_total
        session["max_score"] = max_score
        session["score_display"] = f"{clean_total}/{max_score}"
        session["correct_count"] = correct_count
        session["partially_correct_count"] = partial_count
        session["incorrect_count"] = incorrect_count
        session["percentage"] = percentage
        session["overall_score"] = percentage
        session["performance_summary"] = {
            "total_score": clean_total,
            "max_score": max_score,
            "score_display": f"{clean_total}/{max_score}",
            "percentage": percentage,
            "correct_count": correct_count,
            "partially_correct_count": partial_count,
            "incorrect_count": incorrect_count,
            "performance_tier": "Completed Early",
            "overall_performance": f"Session concluded early with score {clean_total}/{max_score} ({percentage}%).",
            "strengths": ["Partial session practice completed."],
            "improvements": ["Complete all questions for comprehensive scoring."],
            "areas_to_improve": ["Complete all interview questions for in-depth assessment."],
            "recommended_topics": ["General Interview Prep"]
        }

        update_fields = {
            "status": session["status"],
            "completed_at": session["completed_at"],
            "total_score": session.get("total_score"),
            "max_score": session.get("max_score"),
            "score_display": session.get("score_display"),
            "correct_count": session.get("correct_count"),
            "partially_correct_count": session.get("partially_correct_count"),
            "incorrect_count": session.get("incorrect_count"),
            "percentage": session.get("percentage"),
            "overall_score": session.get("overall_score"),
            "performance_summary": session.get("performance_summary")
        }

        if db.is_connected and db.db is not None:
            await db.db.interview_sessions.update_one(
                {"session_id": session_id},
                {"$set": update_fields}
            )
        else:
            in_memory_store.setdefault("interview_sessions", {})
            in_memory_store["interview_sessions"][session_id] = session.copy()

    return session
