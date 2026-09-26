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

    if not answer or not answer.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Answer text cannot be empty."
        )

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

    # Evaluate answer with AI service
    eval_res = await evaluate_interview_answer(
        question=target_q.get("question", ""),
        user_answer=answer.strip(),
        target_career=session.get("target_career", ""),
        difficulty=session.get("difficulty", "")
    )

    # Update question data
    target_q["answer"] = answer.strip()
    target_q["score"] = eval_res.get("score")
    target_q["feedback"] = eval_res.get("feedback")
    target_q["strengths"] = eval_res.get("strengths", [])
    target_q["improvements"] = eval_res.get("improvements", [])
    target_q["model_answer"] = eval_res.get("model_answer")

    questions[curr_idx] = target_q
    session["questions"] = questions

    # Advance current_question pointer
    next_question_num = session["current_question"] + 1
    session["current_question"] = next_question_num

    # Check if session completed
    if next_question_num > session["total_questions"] or all(q.get("score") is not None for q in questions):
        session["status"] = "Completed"
        session["completed_at"] = datetime.now(timezone.utc).isoformat()

        # Calculate overall score
        scores = [q.get("score", 0) for q in questions if q.get("score") is not None]
        overall_score = round(sum(scores) / len(scores), 1) if scores else 0.0
        session["overall_score"] = overall_score

        # Performance summary & Phase 6 integration
        user_ctx = await get_user_full_context(user_id)
        skill_gaps = user_ctx.get("skill_gaps", [])

        # Categorize strengths vs improvements across session
        all_strengths = []
        all_improvements = []
        for q in questions:
            all_strengths.extend(q.get("strengths", []))
            all_improvements.extend(q.get("improvements", []))

        unique_strengths = list(dict.fromkeys(all_strengths))[:3]
        unique_improvements = list(dict.fromkeys(all_improvements))[:3]

        rec_topics = skill_gaps[:2] if skill_gaps else ["System Architecture", "Best Practices"]

        session["performance_summary"] = {
            "overall_score": overall_score,
            "performance_tier": "Excellent" if overall_score >= 85 else ("Good" if overall_score >= 70 else "Needs Practice"),
            "questions_answered": len(scores),
            "strengths": unique_strengths if unique_strengths else ["Clear articulation of concepts."],
            "improvements": unique_improvements if unique_improvements else ["Include more concrete technical examples."],
            "recommended_topics": rec_topics
        }

    # Save updated session
    if db.is_connected and db.db is not None:
        await db.db.interview_sessions.update_one(
            {"session_id": session_id},
            {"$set": {
                "questions": session["questions"],
                "current_question": session["current_question"],
                "status": session["status"],
                "completed_at": session.get("completed_at"),
                "overall_score": session.get("overall_score"),
                "performance_summary": session.get("performance_summary")
            }}
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
        scores = [q.get("score", 0) for q in questions if q.get("score") is not None]
        overall_score = round(sum(scores) / len(scores), 1) if scores else 0.0

        session["status"] = "Completed"
        session["completed_at"] = datetime.now(timezone.utc).isoformat()
        session["overall_score"] = overall_score
        session["performance_summary"] = {
            "overall_score": overall_score,
            "performance_tier": "Completed Early",
            "questions_answered": len(scores),
            "strengths": ["Partial session practice completed."],
            "improvements": ["Complete all questions for comprehensive scoring."],
            "recommended_topics": ["General Interview Prep"]
        }

        if db.is_connected and db.db is not None:
            await db.db.interview_sessions.update_one(
                {"session_id": session_id},
                {"$set": {
                    "status": session["status"],
                    "completed_at": session["completed_at"],
                    "overall_score": session["overall_score"],
                    "performance_summary": session["performance_summary"]
                }}
            )
        else:
            in_memory_store.setdefault("interview_sessions", {})
            in_memory_store["interview_sessions"][session_id] = session.copy()

    return session
