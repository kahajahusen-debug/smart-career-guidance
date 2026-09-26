from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.core.security import get_current_user
from app.services.career_assistant_service import (
    get_user_full_context,
    chat_with_assistant,
    get_assistant_chat_history,
    clear_assistant_chat_history
)

router = APIRouter(prefix="/assistant", tags=["AI Career Assistant"])

class ChatRequest(BaseModel):
    message: str = Field(..., example="What skills should I improve for Full Stack Software Engineer?")

@router.get("/context", summary="Get Authenticated User Context for AI Assistant")
async def get_assistant_context_endpoint(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    context = await get_user_full_context(user_id)
    return {
        "success": True,
        "context": context
    }

@router.post("/chat", summary="Chat with AI Career Assistant")
async def chat_with_assistant_endpoint(
    req: ChatRequest,
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["id"]
    res = await chat_with_assistant(user_id=user_id, message=req.message)
    return res

@router.get("/history", summary="Get Chat History for Authenticated User")
async def get_history_endpoint(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    history = await get_assistant_chat_history(user_id=user_id)
    return {
        "success": True,
        "history": history
    }

@router.delete("/history", summary="Clear Chat History for Authenticated User")
async def clear_history_endpoint(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    res = await clear_assistant_chat_history(user_id=user_id)
    return res
