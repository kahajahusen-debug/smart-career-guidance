from typing import Dict, List, Any
import logging
from app.core.database import db, in_memory_store
from app.models.assessment import SkillGapItem, CareerRecommendationItem, AssessmentResultResponse
from app.services.recommendation_service import calculate_personalized_recommendations

logger = logging.getLogger("uvicorn")

async def generate_career_recommendations(
    user_id: str,
    profile_data: Dict[str, Any],
    answers: Dict[str, int]
) -> AssessmentResultResponse:
    """
    Adapter function for backward compatibility with existing Phase 2/3 calls.
    Delegates to Phase 5 calculate_personalized_recommendations engine.
    """
    # Fetch discovery and skill assessment if available
    if db.is_connected and db.db is not None:
        disc_doc = await db.db.discovery_results.find_one({"user_id": user_id}, {"_id": 0})
        skill_doc = await db.db.skill_assessment_results.find_one({"user_id": user_id}, {"_id": 0})
    else:
        disc_doc = in_memory_store.get("discovery_results", {}).get(user_id)
        skill_doc = in_memory_store.get("skill_assessment_results", {}).get(user_id)

    res_dict = await calculate_personalized_recommendations(
        user_id=user_id,
        profile_doc=profile_data,
        discovery_doc=disc_doc,
        skill_assessment_doc=skill_doc
    )

    career_recs = []
    for rec in res_dict["recommendations"]:
        gaps = [
            SkillGapItem(
                skill_name=g["skill_name"],
                user_score=g["user_score"],
                target_score=g["target_score"],
                status=g["status"]
            )
            for g in rec.get("skill_gaps", [])
        ]
        career_recs.append(CareerRecommendationItem(
            career_id=rec["career_id"],
            title=rec["title"],
            category=rec["category"],
            suitability_score=rec["suitability_score"],
            description=rec["description"],
            matching_skills=rec["matching_skills"],
            skill_gaps=gaps,
            average_salary=rec["average_salary"],
            growth_rate=rec["growth_rate"],
            common_roles=rec["common_roles"]
        ))

    return AssessmentResultResponse(
        user_id=user_id,
        assessment_score=res_dict.get("assessment_score", 75.0),
        career_recommendations=career_recs,
        matched_skills=res_dict.get("matched_skills", []),
        missing_skills=res_dict.get("missing_skills", []),
        recommended_projects=res_dict.get("recommended_projects", [])
    )
