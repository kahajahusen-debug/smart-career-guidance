from typing import Dict, List, Any
from app.core.database import db, in_memory_store

async def evaluate_quiz_submission(answers: Dict[str, int]) -> Dict[str, Any]:
    """
    Evaluates user answers against the master question bank.
    Returns accuracy score and per-skill performance breakdown.
    """
    if db.is_connected and db.db is not None:
        cursor = db.db.questions.find({}, {"_id": 0})
        questions = await cursor.to_list(length=500)
    else:
        questions = in_memory_store.get("questions", [])

    # Map question_id to question object
    q_map = {str(q.get("id")): q for q in questions}

    total_submitted = len(answers)
    correct_count = 0
    skill_stats: Dict[str, Dict[str, int]] = {}

    for q_id, selected_idx in answers.items():
        q_obj = q_map.get(str(q_id))
        if not q_obj:
            continue

        skill = q_obj.get("skill_name", "General")
        if skill not in skill_stats:
            skill_stats[skill] = {"total": 0, "correct": 0}

        skill_stats[skill]["total"] += 1
        
        # Check correctness
        correct_idx = q_obj.get("correct_option_index")
        if selected_idx == correct_idx:
            correct_count += 1
            skill_stats[skill]["correct"] += 1

    overall_accuracy = (correct_count / total_submitted * 100.0) if total_submitted > 0 else 0.0

    skill_scores: Dict[str, float] = {}
    for sk, stat in skill_stats.items():
        if stat["total"] > 0:
            skill_scores[sk] = round((stat["correct"] / stat["total"]) * 100.0, 1)

    return {
        "total_questions": total_submitted,
        "correct_answers": correct_count,
        "overall_accuracy": round(overall_accuracy, 1),
        "skill_scores": skill_scores
    }
