from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.core.security import get_current_user
from app.services.interview_service import (
    start_interview_session,
    get_interview_session,
    submit_interview_answer,
    get_interview_history,
    delete_interview_history,
    finish_interview_session
)

router = APIRouter(prefix="/interview", tags=["Interview Preparation"])

class StartInterviewRequest(BaseModel):
    target_career: Optional[str] = Field(None, example="Full Stack Software Engineer")
    interview_type: Optional[str] = Field("Technical", example="Technical")
    difficulty: Optional[str] = Field("Intermediate", example="Intermediate")
    total_questions: Optional[int] = Field(5, example=5)

class AnswerSubmissionRequest(BaseModel):
    answer: str = Field(..., example="SQL is a relational database management system using structured schemas...")

@router.post("/start", summary="Start a New Interview Preparation Session")
async def start_session_endpoint(
    req: StartInterviewRequest,
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["id"]
    session = await start_interview_session(
        user_id=user_id,
        target_career=req.target_career,
        interview_type=req.interview_type or "Technical",
        difficulty=req.difficulty or "Intermediate",
        total_questions=req.total_questions or 5
    )
    return {
        "success": True,
        "session": session
    }

@router.get("/history", summary="Get Interview Preparation History for Authenticated User")
async def get_history_endpoint(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    sessions = await get_interview_history(user_id=user_id)
    return {
        "success": True,
        "history": sessions
    }

@router.delete("/history", summary="Clear Interview History for Authenticated User")
async def delete_history_endpoint(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    res = await delete_interview_history(user_id=user_id)
    return res

@router.get("/{session_id}", summary="Get Interview Session Details by Session ID")
async def get_session_endpoint(
    session_id: str,
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["id"]
    session = await get_interview_session(user_id=user_id, session_id=session_id)
    return {
        "success": True,
        "session": session
    }

@router.post("/{session_id}/answer", summary="Submit Answer for Current Interview Question")
async def submit_answer_endpoint(
    session_id: str,
    req: AnswerSubmissionRequest,
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["id"]
    res = await submit_interview_answer(
        user_id=user_id,
        session_id=session_id,
        answer=req.answer
    )
    return res

@router.post("/{session_id}/finish", summary="Finish Interview Session Early")
async def finish_session_endpoint(
    session_id: str,
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["id"]
    session = await finish_interview_session(user_id=user_id, session_id=session_id)
    return {
        "success": True,
        "session": session
    }
