from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, Query, HTTPException, status
from app.core.security import get_current_user, get_optional_user
from app.services.portfolio_project_service import (
    get_all_projects,
    get_personalized_project_recommendations,
    get_project_by_id,
    get_user_project_progress,
    update_user_project_progress,
    toggle_project_milestone,
    start_user_project,
    complete_user_project,
    calculate_portfolio_readiness,
    VALID_STATUSES
)

router = APIRouter(prefix="/projects", tags=["Portfolio Projects & Tracking"])

class ProjectProgressUpdatePayload(BaseModel):
    status: Optional[str] = Field(None, description="'Not Started', 'In Progress', or 'Completed'")
    progress_percentage: Optional[int] = Field(None, description="Progress percentage (0-100)")
    completed_milestones: Optional[List[str]] = Field(None, description="List of completed milestone IDs")
    github_url: Optional[str] = Field(None, description="GitHub repository URL")
    live_demo_url: Optional[str] = Field(None, description="Live demo deployment URL")
    documentation_url: Optional[str] = Field(None, description="Documentation or PRD link")

@router.get("", summary="Get Portfolio Projects (Personalized if Authenticated)")
@router.get("/", include_in_schema=False)
async def get_projects(
    category: Optional[str] = Query(None, description="'IT', 'Non-IT', or 'all'"),
    current_user: Optional[dict] = Depends(get_optional_user)
):
    cat_str = category if isinstance(category, str) else None

    if current_user and current_user.get("id"):
        user_id = current_user["id"]
        projects = await get_personalized_project_recommendations(
            user_id=user_id,
            category=cat_str
        )
        readiness = await calculate_portfolio_readiness(user_id=user_id)
        in_progress_cnt = sum(1 for p in projects if p.get("status") == "In Progress")
        completed_cnt = sum(1 for p in projects if p.get("status") == "Completed")
        summary = {
            "recommended_count": len(projects),
            "in_progress_count": in_progress_cnt,
            "completed_count": completed_cnt,
            "portfolio_readiness": readiness
        }
    else:
        projects = await get_all_projects(category=cat_str)
        summary = {
            "recommended_count": len(projects),
            "in_progress_count": 0,
            "completed_count": 0,
            "portfolio_readiness": 0.0
        }

    return {"total": len(projects), "summary": summary, "projects": projects}

@router.get("/recommended", summary="Get Personalized Portfolio Project Recommendations")
async def get_recommended_projects(
    category: Optional[str] = Query(None, description="'IT', 'Non-IT', or 'all'"),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["id"]
    recommended = await get_personalized_project_recommendations(
        user_id=user_id,
        category=category
    )
    readiness = await calculate_portfolio_readiness(user_id=user_id)
    in_progress_cnt = sum(1 for p in recommended if p.get("status") == "In Progress")
    completed_cnt = sum(1 for p in recommended if p.get("status") == "Completed")
    summary = {
        "recommended_count": len(recommended),
        "in_progress_count": in_progress_cnt,
        "completed_count": completed_cnt,
        "portfolio_readiness": readiness
    }
    return {"total": len(recommended), "summary": summary, "projects": recommended}

@router.get("/{project_id}", summary="Get Detailed Project Info & User Progress")
async def get_project_details(
    project_id: str,
    current_user: Optional[dict] = Depends(get_optional_user)
):
    user_id = current_user.get("id") if current_user else None
    return await get_project_by_id(project_id=project_id, user_id=user_id)

@router.get("/{project_id}/progress", summary="Get Authenticated User's Progress for Project")
async def get_project_progress(
    project_id: str,
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["id"]
    # Ensure project exists
    await get_project_by_id(project_id)
    return await get_user_project_progress(user_id=user_id, project_id=project_id)

@router.patch("/{project_id}/progress", summary="Update User Project Progress & URLs")
async def update_project_progress(
    project_id: str,
    payload: ProjectProgressUpdatePayload,
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["id"]
    return await update_user_project_progress(
        user_id=user_id,
        project_id=project_id,
        status_value=payload.status,
        progress_percentage=payload.progress_percentage,
        completed_milestones=payload.completed_milestones,
        github_url=payload.github_url,
        live_demo_url=payload.live_demo_url,
        documentation_url=payload.documentation_url
    )

@router.patch("/{project_id}/milestones/{milestone_id}", summary="Toggle Single Project Milestone")
async def toggle_milestone(
    project_id: str,
    milestone_id: str,
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["id"]
    return await toggle_project_milestone(
        user_id=user_id,
        project_id=project_id,
        milestone_id=milestone_id
    )

@router.post("/{project_id}/start", summary="Start Portfolio Project")
async def start_project(
    project_id: str,
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["id"]
    return await start_user_project(user_id=user_id, project_id=project_id)

@router.post("/{project_id}/complete", summary="Mark Portfolio Project as Completed")
async def complete_project(
    project_id: str,
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["id"]
    return await complete_user_project(user_id=user_id, project_id=project_id)
