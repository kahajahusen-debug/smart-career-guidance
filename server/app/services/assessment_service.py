import json
from pathlib import Path
from typing import Dict, List, Any, Optional
from fastapi import HTTPException, status
from app.core.database import db, in_memory_store

def load_questions_dataset() -> List[Dict[str, Any]]:
    curr = Path(__file__).resolve().parent
    root = curr.parent.parent.parent
    paths = [
        root / "dataset" / "questions.json",
        Path.cwd() / "dataset" / "questions.json",
        Path.cwd().parent / "dataset" / "questions.json"
    ]
    for p in paths:
        if p.exists():
            try:
                with open(p, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                pass
    return in_memory_store.get("questions", [])

async def get_all_questions() -> List[Dict[str, Any]]:
    if db.is_connected and db.db is not None:
        cursor = db.db.questions.find({}, {"_id": 0})
        qs = await cursor.to_list(length=1000)
        if qs:
            return qs
    qs_mem = in_memory_store.get("questions", [])
    if qs_mem:
        return qs_mem
    return load_questions_dataset()

async def evaluate_quiz_submission(answers: Dict[str, int]) -> Dict[str, Any]:
    """
    Evaluates user answers against the master question bank.
    Returns accuracy score and per-skill performance breakdown.
    """
    questions = await get_all_questions()
    q_map = {str(q.get("id")): q for q in questions}

    valid_answers_count = 0
    correct_count = 0
    skill_stats: Dict[str, Dict[str, int]] = {}

    for q_id, selected_idx in answers.items():
        q_obj = q_map.get(str(q_id))
        if not q_obj:
            continue

        options = q_obj.get("options", [])
        if not isinstance(selected_idx, int) or selected_idx < 0 or (options and selected_idx >= len(options)):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid option index {selected_idx} for question '{q_id}'."
            )

        skill = q_obj.get("skill_name", "General")
        if skill not in skill_stats:
            skill_stats[skill] = {"total": 0, "correct": 0}

        skill_stats[skill]["total"] += 1
        valid_answers_count += 1
        
        correct_idx = q_obj.get("correct_option_index")
        if selected_idx == correct_idx:
            correct_count += 1
            skill_stats[skill]["correct"] += 1

    overall_accuracy = (correct_count / valid_answers_count * 100.0) if valid_answers_count > 0 else 0.0

    skill_scores: Dict[str, float] = {}
    for sk, stat in skill_stats.items():
        if stat["total"] > 0:
            skill_scores[sk] = round((stat["correct"] / stat["total"]) * 100.0, 1)

    return {
        "total_questions": valid_answers_count,
        "correct_answers": correct_count,
        "overall_accuracy": round(overall_accuracy, 1),
        "skill_scores": skill_scores
    }

async def evaluate_advanced_skill_assessment(
    user_id: str,
    answers: Dict[str, int]
) -> Dict[str, Any]:
    """
    Phase 4 Advanced Skill Assessment Engine.
    Calculates overall accuracy, skill scores, category breakdown, proficiency levels,
    strong/moderate/needs improvement categorization, and connects with Career Discovery results.
    """
    questions = await get_all_questions()
    q_map = {str(q.get("id")): q for q in questions}

    valid_answers_count = 0
    correct_count = 0

    skill_stats: Dict[str, Dict[str, Any]] = {}
    category_stats: Dict[str, Dict[str, int]] = {}

    for q_id, selected_idx in answers.items():
        q_obj = q_map.get(str(q_id))
        if not q_obj:
            continue

        options = q_obj.get("options", [])
        if not isinstance(selected_idx, int) or selected_idx < 0 or (options and selected_idx >= len(options)):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid option index {selected_idx} for question '{q_id}'."
            )

        sk_name = q_obj.get("skill_name", "General Skill")
        sk_category = q_obj.get("skill_category") or q_obj.get("category") or "General"
        
        if sk_name not in skill_stats:
            skill_stats[sk_name] = {"total": 0, "correct": 0, "category": sk_category}
        
        if sk_category not in category_stats:
            category_stats[sk_category] = {"total": 0, "correct": 0}

        skill_stats[sk_name]["total"] += 1
        category_stats[sk_category]["total"] += 1
        valid_answers_count += 1

        correct_idx = q_obj.get("correct_option_index")
        if selected_idx == correct_idx:
            correct_count += 1
            skill_stats[sk_name]["correct"] += 1
            category_stats[sk_category]["correct"] += 1

    if valid_answers_count == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid question answers found in submission."
        )

    overall_accuracy = (correct_count / valid_answers_count * 100.0) if valid_answers_count > 0 else 0.0

    skill_scores: Dict[str, float] = {}
    category_scores: Dict[str, float] = {}
    proficiency_levels: Dict[str, str] = {}
    strong_skills: List[str] = []
    moderate_skills: List[str] = []
    improve_skills: List[str] = []
    skill_details: List[Dict[str, Any]] = []

    for sk_name, stat in skill_stats.items():
        score = round((stat["correct"] / stat["total"]) * 100.0, 1) if stat["total"] > 0 else 0.0
        skill_scores[sk_name] = score

        # Determine Proficiency Level
        if score >= 85.0:
            level = "Expert"
        elif score >= 70.0:
            level = "Proficient"
        elif score >= 50.0:
            level = "Intermediate"
        else:
            level = "Needs Improvement"

        # Determine Status Tier
        if score >= 75.0:
            tier = "Strong"
            strong_skills.append(sk_name)
        elif score >= 50.0:
            tier = "Moderate"
            moderate_skills.append(sk_name)
        else:
            tier = "Improve"
            improve_skills.append(sk_name)

        proficiency_levels[sk_name] = level

        skill_details.append({
            "skill_name": sk_name,
            "category": stat["category"],
            "score": score,
            "proficiency_level": level,
            "status_tier": tier
        })

    for cat_name, stat in category_stats.items():
        score = round((stat["correct"] / stat["total"]) * 100.0, 1) if stat["total"] > 0 else 0.0
        category_scores[cat_name] = score

    # Connect with Career Discovery Results if available
    discovery_alignment = None
    if user_id:
        if db.is_connected and db.db is not None:
            disc_doc = await db.db.discovery_results.find_one({"user_id": user_id}, {"_id": 0})
        else:
            disc_doc = in_memory_store.get("discovery_results", {}).get(user_id)

        if disc_doc and "top_areas" in disc_doc and disc_doc["top_areas"]:
            top_area_item = disc_doc["top_areas"][0]
            top_area_name = top_area_item.get("area", "")
            top_area_pct = top_area_item.get("percentage", 0.0)

            area_skill_map = {
                "Technical / Software": ["Python", "JavaScript", "SQL", "Docker & Kubernetes"],
                "Data / Analytics": ["Python", "SQL", "Machine Learning"],
                "Design / User Experience": ["UI/UX Design"],
                "Business / Management": ["SEO & SEM", "Product Strategy", "Financial Modeling", "Talent Acquisition"]
            }

            expected_skills = area_skill_map.get(top_area_name, [])
            matching_strong = [s for s in strong_skills if s in expected_skills]

            matching_scores = [skill_scores[s] for s in expected_skills if s in skill_scores]
            synergy = round(sum(matching_scores) / max(1, len(matching_scores)), 1) if matching_scores else 65.0

            if matching_strong:
                summary_str = f"Your assessed proficiency in {', '.join(matching_strong)} directly reinforces your top discovery domain ({top_area_name})."
            else:
                summary_str = f"Your interest in {top_area_name} will benefit from focused skill improvement in core domain areas."

            discovery_alignment = {
                "top_interest_area": top_area_name,
                "top_interest_percentage": top_area_pct,
                "matching_strong_skills": matching_strong,
                "synergy_score": synergy,
                "summary": summary_str
            }

    return {
        "overall_accuracy": round(overall_accuracy, 1),
        "total_questions": valid_answers_count,
        "correct_answers": correct_count,
        "skill_scores": skill_scores,
        "category_scores": category_scores,
        "proficiency_levels": proficiency_levels,
        "strong_skills": strong_skills,
        "moderate_skills": moderate_skills,
        "improve_skills": improve_skills,
        "skill_details": skill_details,
        "discovery_alignment": discovery_alignment
    }
