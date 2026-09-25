from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from app.core.security import get_current_user
from app.services.application_service import (
    create_application,
    get_applications_for_user,
    get_application_by_id,
    update_application,
    delete_application,
    get_application_stats,
    VALID_APPLICATION_STATUSES
)

router = APIRouter(prefix="/applications", tags=["Application Tracking"])

class ApplicationCreateSchema(BaseModel):
    job_id: str
    status: Optional[str] = "Saved"
    notes: Optional[str] = ""
    applied_at: Optional[str] = None

class ApplicationUpdateSchema(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None
    applied_at: Optional[str] = None

@router.post("", summary="Create Application Tracking Record", status_code=status.HTTP_201_CREATED)
@router.post("/", include_in_schema=False, status_code=status.HTTP_201_CREATED)
async def create_app_endpoint(
    payload: ApplicationCreateSchema,
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["id"]
    try:
        app_doc = await create_application(user_id, payload.dict())
        return app_doc
    except ValueError as e:
        err_msg = str(e)
        if "not found" in err_msg.lower() or "does not exist" in err_msg.lower():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=err_msg)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=err_msg)

@router.get("", summary="Get All Applications for Current User")
@router.get("/", include_in_schema=False)
async def get_apps_endpoint(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    apps = await get_applications_for_user(user_id)
    return {"applications": apps, "total": len(apps)}

@router.get("/stats", summary="Get Application Tracking Dashboard Statistics")
async def get_app_stats_endpoint(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    stats = await get_application_stats(user_id)
    return stats

@router.get("/{application_id}", summary="Get Single Application Details")
async def get_app_detail_endpoint(
    application_id: str,
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["id"]
    app_doc = await get_application_by_id(user_id, application_id)
    if not app_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application with ID '{application_id}' not found for current user."
        )
    return app_doc

@router.patch("/{application_id}", summary="Update Application Status, Notes, or Applied Date")
async def update_app_endpoint(
    application_id: str,
    payload: ApplicationUpdateSchema,
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["id"]
    try:
        updated_doc = await update_application(user_id, application_id, payload.dict(exclude_unset=True))
        return updated_doc
    except KeyError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.delete("/{application_id}", summary="Delete Application Tracking Record")
async def delete_app_endpoint(
    application_id: str,
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["id"]
    success = await delete_application(user_id, application_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application with ID '{application_id}' not found or already deleted."
        )
    return {"message": f"Application '{application_id}' deleted successfully."}
