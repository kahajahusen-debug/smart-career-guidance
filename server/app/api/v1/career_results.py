from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.database import db, in_memory_store
from app.core.security import get_current_user
from app.services.recommendation_service import calculate_personalized_recommendations
from app.services.action_plan_service import (
    get_or_create_action_plan,
    update_action_plan_progress,
    VALID_STATUSES
)

router = APIRouter(prefix="/career-results", tags=["Career Results & Action Roadmap"])

class TargetCareerPayload(BaseModel):
    target_career_id: Optional[str] = Field(None, description="Career ID to set as target")

class ActionProgressPayload(BaseModel):
    item_id: str = Field(..., description="Skill ID or Project ID to update")
    item_type: str = Field("skill", description="'skill' or 'project'")
    status: str = Field(..., description="'Not Started', 'In Progress', or 'Completed'")

@router.get("", summary="Get Dynamic Personalized Career Results for Authenticated User")
@router.get("/", include_in_schema=False)
async def get_career_results(
    category: Optional[str] = Query(None, description="Filter by IT, Non-IT, or all"),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["id"]

    # Load authenticated user's actual stored documents
    if db.is_connected and db.db is not None:
        profile_doc = await db.db.profiles.find_one({"user_id": user_id}, {"_id": 0})
        disc_doc = await db.db.discovery_results.find_one({"user_id": user_id}, {"_id": 0})
        skill_doc = await db.db.skill_assessment_results.find_one({"user_id": user_id}, {"_id": 0})
    else:
        profile_doc = in_memory_store.get("profiles", {}).get(user_id)
        disc_doc = in_memory_store.get("discovery_results", {}).get(user_id)
        skill_doc = in_memory_store.get("skill_assessment_results", {}).get(user_id)

    # Validate actual completion status from stored records — do not trust frontend flags
    discovery_completed = (
        disc_doc is not None
        and bool(disc_doc.get("top_areas"))
    )
    skill_assessment_completed = (
        skill_doc is not None
        and skill_doc.get("overall_accuracy") is not None
        and isinstance(skill_doc.get("overall_accuracy"), (int, float))
    )

    # Calculate dynamic personalized recommendations
    # The recommendation engine itself enforces the gate — returns empty list when incomplete
    recs = await calculate_personalized_recommendations(
        user_id=user_id,
        profile_doc=profile_doc,
        discovery_doc=disc_doc if discovery_completed else None,
        skill_assessment_doc=skill_doc if skill_assessment_completed else None,
        category_filter=category
    )

    # Add explicit completion status flags to response
    recs["discovery_completed"] = discovery_completed
    recs["skill_assessment_completed"] = skill_assessment_completed
    recs["both_assessments_complete"] = discovery_completed and skill_assessment_completed

    # Retrieve user's action plan / learning roadmap (only if assessments done)
    if discovery_completed and skill_assessment_completed:
        action_plan = await get_or_create_action_plan(user_id)
    else:
        action_plan = {"status": "Not Created", "has_user_selected_target": False}

    recs["action_plan"] = action_plan
    recs["target_career_id"] = action_plan.get("target_career_id")
    recs["target_career_title"] = action_plan.get("target_career_title")
    recs["target_career_category"] = action_plan.get("target_career_category")
    recs["readiness_score"] = action_plan.get("readiness_score")
    recs["roadmap"] = action_plan.get("roadmap", [])
    recs["milestones"] = action_plan.get("milestones", [])
    recs["calculation_explanation"] = (
        "Suitability percentages are calculated across 5 dimensions using your actual profile and test data: "
        "Skill Match (35%), Career Discovery Interests (25%), Skill Assessment Accuracy (20%), "
        "Educational Background Fit (10%), and Domain/Work Style Preference (10%)."
    )
    recs["disclaimer"] = (
        "Suitability score is an estimate based on your current skills, interests, and educational background. "
        "It is designed for career exploration and learning prioritization, not as a legal or contractual guarantee of employment."
    )

    return recs

@router.get("/{career_id}", summary="Get Specific Career Result Match Detail")
async def get_career_result_detail(
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
            detail=f"Career '{career_id}' not found in personalized results."
        )

    return rec_item

@router.post("/target", summary="Set or Update Target Career in Career Results")
async def set_target_career(
    payload: TargetCareerPayload,
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["id"]
    new_plan = await get_or_create_action_plan(user_id, payload.target_career_id, force_rebuild=True)
    return {
        "success": True,
        "message": f"Target career successfully updated to {new_plan.get('target_career_title')}.",
        "action_plan": new_plan
    }

@router.patch("/progress", summary="Update Learning Roadmap Item Progress")
async def update_roadmap_progress(
    payload: ActionProgressPayload,
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["id"]
    if payload.status not in VALID_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status '{payload.status}'. Allowed: {', '.join(VALID_STATUSES)}."
        )

    updated_plan = await update_action_plan_progress(
        user_id=user_id,
        item_id=payload.item_id,
        item_type=payload.item_type,
        status_value=payload.status
    )

    return {
        "success": True,
        "message": f"Updated '{payload.item_id}' status to '{payload.status}'.",
        "action_plan": updated_plan
    }
