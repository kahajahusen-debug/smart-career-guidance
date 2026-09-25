from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.core.database import db, in_memory_store
from app.core.security import get_current_user
from app.services.recommendation_service import calculate_personalized_recommendations

router = APIRouter(prefix="/recommendations", tags=["Personalized Career Recommendation Engine"])

@router.get("", summary="Get Dynamic Personalized Career Recommendations for Authenticated User")
@router.get("/", include_in_schema=False)
async def get_personalized_recommendations(
    category: Optional[str] = Query(None, description="Filter by IT, Non-IT, or all"),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["id"]

    # Load profile, discovery, and skill assessment for user
    if db.is_connected and db.db is not None:
        profile_doc = await db.db.profiles.find_one({"user_id": user_id}, {"_id": 0})
        disc_doc = await db.db.discovery_results.find_one({"user_id": user_id}, {"_id": 0})
        skill_doc = await db.db.skill_assessment_results.find_one({"user_id": user_id}, {"_id": 0})
    else:
        profile_doc = in_memory_store.get("profiles", {}).get(user_id)
        disc_doc = in_memory_store.get("discovery_results", {}).get(user_id)
        skill_doc = in_memory_store.get("skill_assessment_results", {}).get(user_id)

    res = await calculate_personalized_recommendations(
        user_id=user_id,
        profile_doc=profile_doc,
        discovery_doc=disc_doc,
        skill_assessment_doc=skill_doc,
        category_filter=category
    )

    return res

@router.get("/{career_id}", summary="Get Personalized Career Detail & Matching Score")
async def get_personalized_career_detail(
    career_id: str,
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["id"]

    if db.is_connected and db.db is not None:
        profile_doc = await db.db.profiles.find_one({"user_id": user_id}, {"_id": 0})
        disc_doc = await db.db.discovery_results.find_one({"user_id": user_id}, {"_id": 0})
        skill_doc = await db.db.skill_assessment_results.find_one({"user_id": user_id}, {"_id": 0})
    else:
        profile_doc = in_memory_store.get("profiles", {}).get(user_id)
        disc_doc = in_memory_store.get("discovery_results", {}).get(user_id)
        skill_doc = in_memory_store.get("skill_assessment_results", {}).get(user_id)

    res = await calculate_personalized_recommendations(
        user_id=user_id,
        profile_doc=profile_doc,
        discovery_doc=disc_doc,
        skill_assessment_doc=skill_doc
    )

    rec_item = next((r for r in res.get("recommendations", []) if r.get("career_id") == career_id), None)
    if not rec_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Career profile '{career_id}' not found in recommendations."
        )

    return rec_item
