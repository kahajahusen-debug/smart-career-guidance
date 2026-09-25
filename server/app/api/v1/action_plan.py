from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.security import get_current_user
from app.services.action_plan_service import (
    get_or_create_action_plan,
    update_action_plan_progress,
    VALID_STATUSES
)

router = APIRouter(prefix="/action-plan", tags=["Career Action Plan & Skill Gap Roadmap"])

class ProgressUpdatePayload(BaseModel):
    item_id: str = Field(..., description="Skill ID or Project ID to update")
    item_type: str = Field("skill", description="'skill' or 'project'")
    status: str = Field(..., description="'Not Started', 'In Progress', or 'Completed'")

class RegeneratePayload(BaseModel):
    target_career_id: Optional[str] = Field(None, description="Optional target career ID")

@router.get("", summary="Get Complete Personalized Career Action Plan")
@router.get("/", include_in_schema=False)
async def get_action_plan(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    return await get_or_create_action_plan(user_id)

@router.get("/skill-gaps", summary="Get Skill Gap Analysis Breakdown")
async def get_skill_gaps(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    plan = await get_or_create_action_plan(user_id)
    return {
        "target_career_id": plan["target_career_id"],
        "target_career_title": plan["target_career_title"],
        "suitability_score": plan["suitability_score"],
        "skill_gaps": plan["skill_gaps"]
    }

@router.get("/roadmap", summary="Get Prioritized Learning Roadmap")
async def get_learning_roadmap(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    plan = await get_or_create_action_plan(user_id)
    return {
        "target_career_id": plan["target_career_id"],
        "target_career_title": plan["target_career_title"],
        "overall_progress_pct": plan["overall_progress_pct"],
        "roadmap": plan["roadmap"]
    }

@router.get("/projects", summary="Get Recommended Portfolio Projects")
async def get_recommended_projects(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    plan = await get_or_create_action_plan(user_id)
    return {
        "target_career_id": plan["target_career_id"],
        "target_career_title": plan["target_career_title"],
        "recommended_projects": plan["recommended_projects"]
    }

@router.get("/readiness", summary="Get Job Readiness Analysis & Matrix")
async def get_job_readiness(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    plan = await get_or_create_action_plan(user_id)
    return {
        "target_career_id": plan["target_career_id"],
        "target_career_title": plan["target_career_title"],
        "readiness_score": plan["readiness_score"],
        "readiness_breakdown": plan["readiness_breakdown"]
    }

@router.patch("/progress", summary="Update Roadmap Skill or Project Progress Status")
async def update_progress(
    payload: ProgressUpdatePayload,
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["id"]
    if payload.status not in VALID_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status '{payload.status}'. Allowed statuses: {', '.join(VALID_STATUSES)}."
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
        "overall_progress_pct": updated_plan["overall_progress_pct"],
        "readiness_score": updated_plan["readiness_score"],
        "action_plan": updated_plan
    }

@router.post("/regenerate", summary="Regenerate Action Plan based on Updated Assessments or Target Career")
async def regenerate_action_plan(
    payload: Optional[RegeneratePayload] = None,
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["id"]
    target_cid = payload.target_career_id if payload else None

    plan = await get_or_create_action_plan(
        user_id=user_id,
        target_career_id=target_cid,
        force_rebuild=True
    )

    return plan
