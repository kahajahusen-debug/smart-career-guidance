import uuid
import logging
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional
from app.core.database import db, in_memory_store
from app.db.seeds.seed_data import CAREERS_SEED
from app.models.assessment import (
    SkillGapItem, 
    CareerRecommendationItem, 
    AssessmentResultResponse
)

logger = logging.getLogger("uvicorn")

async def get_all_careers_data() -> List[Dict[str, Any]]:
    if db.is_connected and db.db is not None:
        cursor = db.db.careers.find({}, {"_id": 0})
        careers = await cursor.to_list(length=100)
        if careers:
            return careers
    careers = in_memory_store.get("careers", [])
    if careers:
        return careers
    return CAREERS_SEED

async def calculate_personalized_recommendations(
    user_id: str,
    profile_doc: Optional[Dict[str, Any]] = None,
    discovery_doc: Optional[Dict[str, Any]] = None,
    skill_assessment_doc: Optional[Dict[str, Any]] = None,
    category_filter: Optional[str] = None
) -> Dict[str, Any]:
    """
    Phase 5 Dynamic Personalized Career Recommendation Engine.
    
    Weights:
    - Skill Match: 35%
    - Career Discovery Match: 25%
    - Skill Assessment Match: 20%
    - Education Match: 10%
    - Work Style Match: 10%
    """
    has_profile = profile_doc is not None and bool(profile_doc.get("current_skills") or profile_doc.get("interests"))
    has_discovery = discovery_doc is not None and bool(discovery_doc.get("top_areas"))
    has_assessment = skill_assessment_doc is not None and skill_assessment_doc.get("overall_accuracy") is not None

    if has_profile and has_discovery and has_assessment:
        data_completeness = "Complete"
        message = "Recommendations dynamically calculated from your complete profile, discovery, and assessment metrics."
    else:
        data_completeness = "Incomplete"
        missing_parts = []
        if not has_profile: missing_parts.append("Profile")
        if not has_discovery: missing_parts.append("Career Discovery")
        if not has_assessment: missing_parts.append("Skill Assessment")
        message = f"Complete your {', '.join(missing_parts)} to receive fully accurate personalized recommendations."

    # Extract user attributes
    current_skills_user = [s.strip().lower() for s in (profile_doc.get("current_skills", []) if profile_doc else [])]
    user_interests = [i.strip().lower() for i in (profile_doc.get("interests", []) if profile_doc else [])]
    user_pref_cat = (profile_doc.get("preferred_category", "Both") if profile_doc else "Both").strip().lower()
    user_degree = (profile_doc.get("degree", "") or profile_doc.get("education_level", "") if profile_doc else "").strip().lower()
    user_major = (profile_doc.get("major", "") if profile_doc else "").strip().lower()
    user_work_style = (profile_doc.get("work_style", "") if profile_doc else "").strip().lower()

    # Extract Discovery attributes
    top_disc_areas = []
    if discovery_doc and "top_areas" in discovery_doc:
        for ta in discovery_doc["top_areas"]:
            top_disc_areas.append({
                "area": ta.get("area", "").lower(),
                "pct": float(ta.get("percentage", 0.0))
            })

    # Extract Skill Assessment attributes
    ass_accuracy = float(skill_assessment_doc.get("overall_accuracy", 50.0)) if skill_assessment_doc else 50.0
    ass_strong_skills = [s.lower() for s in (skill_assessment_doc.get("strong_skills", []) if skill_assessment_doc else [])]
    ass_moderate_skills = [s.lower() for s in (skill_assessment_doc.get("moderate_skills", []) if skill_assessment_doc else [])]
    ass_improve_skills = [s.lower() for s in (skill_assessment_doc.get("improve_skills", []) if skill_assessment_doc else [])]
    ass_skill_scores = {k.lower(): float(v) for k, v in (skill_assessment_doc.get("skill_scores", {}).items() if skill_assessment_doc else {})}

    all_careers = await get_all_careers_data()

    # Fetch projects for portfolio recommendations
    if db.is_connected and db.db is not None:
        p_cursor = db.db.projects.find({}, {"_id": 0})
        all_projects = await p_cursor.to_list(length=100)
    else:
        all_projects = in_memory_store.get("projects", [])

    recommendations_list: List[Dict[str, Any]] = []
    global_matched_skills: set = set()
    global_missing_skills: set = set()

    for car in all_careers:
        car_id = car.get("id", "")
        car_title = car.get("title", "")
        car_category = car.get("category", "")
        car_desc = car.get("description", "")
        required_skills = car.get("required_skills", [])

        # Filter by category if requested
        if category_filter and category_filter.lower() != "all":
            if car_category.lower() != category_filter.lower():
                continue

        # ----------------------------------------------------
        # 1. SKILL MATCH SCORE (35%)
        # ----------------------------------------------------
        car_matching_skills: List[str] = []
        car_missing_skills: List[str] = []
        skill_gap_items: List[Dict[str, Any]] = []

        total_skill_weight = 0.0
        weighted_skill_sum = 0.0

        for req in required_skills:
            sk_name = req.get("skill_name", "")
            target_score = float(req.get("target_score", 75))
            weight = float(req.get("weight", 1.0))
            total_skill_weight += weight
            sk_name_lower = sk_name.lower()

            # Profile skill presence
            has_profile_skill = any(sk_name_lower in s or s in sk_name_lower for s in current_skills_user if len(s) >= 2)
            
            # Assessment score for this skill
            if sk_name_lower in ass_skill_scores:
                eval_score = ass_skill_scores[sk_name_lower]
            elif sk_name_lower in ass_strong_skills:
                eval_score = 85.0
            elif sk_name_lower in ass_moderate_skills:
                eval_score = 65.0
            elif sk_name_lower in ass_improve_skills:
                eval_score = 40.0
            else:
                eval_score = 70.0 if has_profile_skill else 35.0

            # Combined user score
            if has_profile_skill:
                user_score = round(max(eval_score, 65.0 if has_assessment else 75.0), 1)
            else:
                user_score = round(eval_score, 1)

            match_ratio = min(1.0, user_score / target_score) if target_score > 0 else 1.0
            weighted_skill_sum += (match_ratio * weight)

            if user_score >= (target_score * 0.8):
                status_tier = "Strong"
                car_matching_skills.append(sk_name)
                global_matched_skills.add(sk_name)
            elif user_score >= (target_score * 0.6):
                status_tier = "Good"
                car_matching_skills.append(sk_name)
                global_matched_skills.add(sk_name)
            else:
                status_tier = "Improve"
                car_missing_skills.append(sk_name)
                global_missing_skills.add(sk_name)

            skill_gap_items.append({
                "skill_name": sk_name,
                "user_score": user_score,
                "target_score": target_score,
                "status": status_tier
            })

        skill_match_score = round((weighted_skill_sum / total_skill_weight * 100.0), 1) if total_skill_weight > 0 else 60.0

        # ----------------------------------------------------
        # 2. CAREER DISCOVERY / INTEREST MATCH (25%)
        # ----------------------------------------------------
        disc_match_score = 50.0
        if top_disc_areas:
            primary_area = top_disc_areas[0]["area"]
            primary_pct = top_disc_areas[0]["pct"]

            if "technical" in primary_area or "software" in primary_area:
                if car_category.lower() == "it":
                    disc_match_score = min(100.0, primary_pct + 15.0)
                else:
                    disc_match_score = 50.0
            elif "data" in primary_area or "analytics" in primary_area:
                if "data" in car_title.lower() or "ml" in car_title.lower() or "financial" in car_title.lower():
                    disc_match_score = min(100.0, primary_pct + 20.0)
                elif car_category.lower() == "it":
                    disc_match_score = 75.0
                else:
                    disc_match_score = 60.0
            elif "design" in primary_area or "ux" in primary_area:
                if "ui/ux" in car_title.lower() or "designer" in car_title.lower():
                    disc_match_score = min(100.0, primary_pct + 25.0)
                else:
                    disc_match_score = 55.0
            elif "business" in primary_area or "management" in primary_area:
                if car_category.lower() == "non-it" or "manager" in car_title.lower() or "strategist" in car_title.lower():
                    disc_match_score = min(100.0, primary_pct + 20.0)
                else:
                    disc_match_score = 60.0

        # Profile Interest boost
        if user_interests:
            intr_text = " ".join(user_interests)
            search_blob = f"{car_title} {car_category} {car_desc}".lower()
            if any(intr in search_blob for intr in user_interests):
                disc_match_score = min(100.0, disc_match_score + 15.0)

        disc_match_score = round(max(30.0, min(100.0, disc_match_score)), 1)

        # ----------------------------------------------------
        # 3. SKILL ASSESSMENT MATCH SCORE (20%)
        # ----------------------------------------------------
        if has_assessment:
            # Check how many required skills for this career were tested as Strong vs Improve
            strong_matches = sum(1 for req in required_skills if req.get("skill_name", "").lower() in ass_strong_skills)
            improve_matches = sum(1 for req in required_skills if req.get("skill_name", "").lower() in ass_improve_skills)

            assessment_match_score = ass_accuracy + (strong_matches * 8.0) - (improve_matches * 6.0)
        else:
            assessment_match_score = 70.0

        assessment_match_score = round(max(20.0, min(100.0, assessment_match_score)), 1)

        # ----------------------------------------------------
        # 4. EDUCATION MATCH SCORE (10%)
        # ----------------------------------------------------
        edu_score = 70.0
        combo_edu = f"{user_degree} {user_major}"
        if car_category.lower() == "it":
            if any(w in combo_edu for w in ["computer", "cs", "software", "it", "data", "engineering", "b.tech", "m.tech", "bca", "mca"]):
                edu_score = 95.0
            elif combo_edu.strip():
                edu_score = 75.0
            else:
                edu_score = 70.0
        else:
            if any(w in combo_edu for w in ["business", "marketing", "finance", "management", "mba", "bba", "arts", "commerce", "health"]):
                edu_score = 95.0
            elif combo_edu.strip():
                edu_score = 75.0
            else:
                edu_score = 70.0

        edu_score = round(edu_score, 1)

        # ----------------------------------------------------
        # 5. WORK STYLE MATCH SCORE (10%)
        # ----------------------------------------------------
        work_style_score = 75.0
        if user_work_style:
            if "analytical" in user_work_style and any(k in car_title.lower() for k in ["data", "engineer", "financial", "analyst"]):
                work_style_score = 95.0
            elif "creative" in user_work_style and any(k in car_title.lower() for k in ["designer", "marketing", "product"]):
                work_style_score = 95.0
            elif "collaborative" in user_work_style and any(k in car_title.lower() for k in ["manager", "hr", "operations"]):
                work_style_score = 90.0

        work_style_score = round(work_style_score, 1)

        # ----------------------------------------------------
        # FINAL WEIGHTED SUITABILITY SCORE
        # Formula: Skill (35%) + Discovery (25%) + Assessment (20%) + Education (10%) + WorkStyle (10%)
        # ----------------------------------------------------
        final_score = (
            (skill_match_score * 0.35) +
            (disc_match_score * 0.25) +
            (assessment_match_score * 0.20) +
            (edu_score * 0.10) +
            (work_style_score * 0.10)
        )

        final_score = round(max(25.0, min(99.0, final_score)), 1)

        # Build Explainable Reason String
        reasons = []
        if car_matching_skills:
            reasons.append(f"Matching strengths in {', '.join(car_matching_skills[:3])}")
        if disc_match_score >= 75.0:
            reasons.append("High career interest alignment")
        if assessment_match_score >= 75.0:
            reasons.append("Strong skill assessment score")
        if edu_score >= 85.0:
            reasons.append("Compatible educational background")

        reason_str = ". ".join(reasons) + "." if reasons else "Your skill profile and preferences align with this career pathway."

        # Filter projects for this career
        car_projects = [
            p for p in all_projects 
            if any(s.lower() in [r.get("skill_name","").lower() for r in required_skills] for s in p.get("skills_covered", []))
        ]
        if not car_projects:
            car_projects = all_projects[:2]

        recommendations_list.append({
            "career_id": car_id,
            "title": car_title,
            "category": car_category,
            "suitability_score": final_score,
            "description": car_desc,
            "matching_skills": car_matching_skills,
            "missing_skills": car_missing_skills,
            "skill_gaps": skill_gap_items,
            "interest_match": disc_match_score,
            "skill_match": skill_match_score,
            "assessment_match": assessment_match_score,
            "education_match": edu_score,
            "work_style_match": work_style_score,
            "reason": reason_str,
            "average_salary": car.get("average_salary", "N/A"),
            "growth_rate": car.get("growth_rate", "N/A"),
            "common_roles": car.get("common_roles", []),
            "entry_requirements": car.get("entry_requirements", ""),
            "recommended_projects": car_projects[:2]
        })

    # Sort recommendations by suitability_score descending
    recommendations_list.sort(key=lambda x: x["suitability_score"], reverse=True)

    # Global portfolio project recommendations
    global_top_missing = list(global_missing_skills)
    global_projects = []
    for p in all_projects:
        p_skills = [s.lower() for s in p.get("skills_covered", [])]
        if any(ms.lower() in p_skills for ms in global_top_missing) or len(global_projects) < 2:
            global_projects.append(p)
    if not global_projects:
        global_projects = all_projects[:3]

    top_score = recommendations_list[0]["suitability_score"] if recommendations_list else 75.0

    return {
        "user_id": user_id,
        "assessment_score": ass_accuracy,
        "recommendations": recommendations_list,
        "career_recommendations": recommendations_list, # Backward compatibility alias
        "matched_skills": list(global_matched_skills),
        "missing_skills": list(global_missing_skills),
        "recommended_projects": global_projects,
        "has_profile": has_profile,
        "has_discovery": has_discovery,
        "has_assessment": has_assessment,
        "data_completeness": data_completeness,
        "message": message,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
