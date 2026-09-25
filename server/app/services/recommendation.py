from typing import Dict, List, Any
import logging
from app.core.database import db, in_memory_store
from app.services.assessment_service import evaluate_quiz_submission
from app.models.assessment import SkillGapItem, CareerRecommendationItem, AssessmentResultResponse

logger = logging.getLogger("uvicorn")

async def generate_career_recommendations(
    user_id: str,
    profile_data: Dict[str, Any],
    answers: Dict[str, int]
) -> AssessmentResultResponse:
    """
    Core Recommendation Engine.
    Formula:
    Suitability Score = Skill Match (55%) + Interest Alignment (30%) + Category Preference (15%)
    """
    # 1. Evaluate quiz performance
    quiz_eval = await evaluate_quiz_submission(answers)
    quiz_skill_scores = quiz_eval.get("skill_scores", {})
    overall_quiz_accuracy = quiz_eval.get("overall_accuracy", 75.0)

    # 2. Extract profile attributes
    current_skills_user = [s.strip().lower() for s in profile_data.get("current_skills", [])]
    user_interests = [i.strip().lower() for i in profile_data.get("interests", [])]
    user_category_pref = profile_data.get("preferred_category", "Both").strip()

    # 3. Load Careers, Projects, Jobs
    if db.is_connected and db.db is not None:
        c_cursor = db.db.careers.find({}, {"_id": 0})
        careers = await c_cursor.to_list(length=100)

        p_cursor = db.db.projects.find({}, {"_id": 0})
        projects = await p_cursor.to_list(length=100)

        j_cursor = db.db.jobs.find({}, {"_id": 0})
        jobs = await j_cursor.to_list(length=100)
    else:
        careers = in_memory_store.get("careers", [])
        projects = in_memory_store.get("projects", [])
        jobs = in_memory_store.get("jobs", [])

    career_recommendations: List[CareerRecommendationItem] = []
    all_matched_skills: set = set()
    all_missing_skills: set = set()

    for car in careers:
        car_id = car.get("id", "")
        car_title = car.get("title", "")
        car_category = car.get("category", "")
        car_desc = car.get("description", "")
        required_skills = car.get("required_skills", [])

        # --- A. SKILL MATCH (55%) ---
        total_weight = 0.0
        weighted_match_sum = 0.0
        skill_gap_items: List[SkillGapItem] = []
        car_matching_skills: List[str] = []

        for req in required_skills:
            sk_name = req.get("skill_name", "")
            target_score = float(req.get("target_score", 75))
            weight = float(req.get("weight", 1.0))
            total_weight += weight

            sk_name_lower = sk_name.lower()

            # Self-reported baseline score
            if any(sk_name_lower in s for s in current_skills_user) or any(s in sk_name_lower for s in current_skills_user if len(s) > 2):
                baseline_user_score = 75.0
            else:
                baseline_user_score = 35.0

            # Quiz performance adjustment if skill was assessed
            if sk_name in quiz_skill_scores:
                quiz_score = quiz_skill_scores[sk_name]
                user_score = (baseline_user_score * 0.3) + (quiz_score * 0.7)
            else:
                user_score = (baseline_user_score * 0.5) + (overall_quiz_accuracy * 0.5)

            user_score = round(min(100.0, max(0.0, user_score)), 1)
            match_ratio = min(1.0, user_score / target_score) if target_score > 0 else 1.0
            weighted_match_sum += (match_ratio * weight)

            # Determine status badge
            if user_score >= (target_score * 0.88):
                status = "Strong"
                car_matching_skills.append(sk_name)
                all_matched_skills.add(sk_name)
            elif user_score >= (target_score * 0.65):
                status = "Good"
                car_matching_skills.append(sk_name)
                all_matched_skills.add(sk_name)
            else:
                status = "Improve"
                all_missing_skills.add(sk_name)

            skill_gap_items.append(SkillGapItem(
                skill_name=sk_name,
                user_score=user_score,
                target_score=target_score,
                status=status
            ))

        skill_match_pct = (weighted_match_sum / total_weight * 100.0) if total_weight > 0 else 70.0

        # --- B. INTEREST ALIGNMENT (30%) ---
        interest_match_count = 0
        search_text = f"{car_title} {car_category} {car_desc} {' '.join([r.get('skill_name','') for r in required_skills])}".lower()

        if user_interests:
            for intr in user_interests:
                if intr in search_text or any(word in search_text for word in intr.split() if len(word) > 2):
                    interest_match_count += 1
            interest_align_pct = min(100.0, max(40.0, (interest_match_count / max(1, len(user_interests))) * 100.0 + 30.0))
        else:
            interest_align_pct = 65.0

        # --- C. CATEGORY PREFERENCE (15%) ---
        if user_category_pref == "Both":
            category_score_pct = 100.0
        elif user_category_pref.lower() == car_category.lower():
            category_score_pct = 100.0
        else:
            category_score_pct = 60.0

        # --- FINAL TRANSPARENT SUITABILITY SCORE ---
        final_suitability = (skill_match_pct * 0.55) + (interest_align_pct * 0.30) + (category_score_pct * 0.15)
        final_suitability = round(min(98.0, max(25.0, final_suitability)), 1)

        career_recommendations.append(CareerRecommendationItem(
            career_id=car_id,
            title=car_title,
            category=car_category,
            suitability_score=final_suitability,
            description=car_desc,
            matching_skills=car_matching_skills,
            skill_gaps=skill_gap_items,
            average_salary=car.get("average_salary", "N/A"),
            growth_rate=car.get("growth_rate", "N/A"),
            common_roles=car.get("common_roles", [])
        ))

    # Sort recommendations by suitability percentage descending
    career_recommendations.sort(key=lambda x: x.suitability_score, reverse=True)

    # Find Recommended Projects for missing skills
    recommended_projects = []
    top_missing = list(all_missing_skills)
    for p in projects:
        p_skills = p.get("skills_covered", [])
        if any(ms in p_skills for ms in top_missing) or len(recommended_projects) < 2:
            recommended_projects.append(p)
    if not recommended_projects:
        recommended_projects = projects[:3]

    result_response = AssessmentResultResponse(
        user_id=user_id,
        assessment_score=quiz_eval.get("overall_accuracy", 75.0),
        career_recommendations=career_recommendations,
        matched_skills=list(all_matched_skills),
        missing_skills=list(all_missing_skills),
        recommended_projects=recommended_projects
    )

    return result_response
