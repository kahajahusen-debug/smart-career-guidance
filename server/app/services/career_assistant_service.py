import uuid
import logging
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional
from fastapi import HTTPException, status

from app.core.database import db, in_memory_store
from app.services.ai_service import generate_career_assistant_response
from app.services.action_plan_service import get_or_create_action_plan

logger = logging.getLogger("uvicorn")

from app.services.portfolio_project_service import get_personalized_project_recommendations

async def get_user_full_context(user_id: str) -> Dict[str, Any]:
    """Gather comprehensive authenticated user context across Phase 1-8 modules."""
    profile_doc = None
    action_plan_doc = None
    user_prog_list = []
    projects_res = None

    if db.is_connected and db.db is not None:
        profile_doc = await db.db.profiles.find_one({"user_id": user_id}, {"_id": 0})
        user_prog_list = await db.db.user_project_progress.find({"user_id": user_id}, {"_id": 0}).to_list(length=100)
    else:
        profile_doc = in_memory_store.get("profiles", {}).get(user_id)
        prog_store = in_memory_store.get("user_project_progress", {})
        user_prog_list = [v for k, v in prog_store.items() if k.startswith(f"{user_id}_")]

    try:
        action_plan_doc = await get_or_create_action_plan(user_id=user_id)
    except Exception as e:
        logger.warning(f"Could not load action plan for assistant context: {e}")

    try:
        projects_res = await get_personalized_project_recommendations(user_id=user_id)
    except Exception as e:
        logger.warning(f"Could not load project recommendations for assistant context: {e}")

    target_career = "Full Stack Software Engineer"
    if action_plan_doc and action_plan_doc.get("target_career_title"):
        target_career = action_plan_doc.get("target_career_title")
    elif profile_doc and profile_doc.get("preferred_category") == "Non-IT":
        target_career = "Digital Marketing & Analytics Strategist"

    current_skills = profile_doc.get("current_skills", []) if profile_doc else []
    skill_gaps = [sg.get("skill_name") for sg in action_plan_doc.get("skill_gaps", [])] if action_plan_doc else []
    if isinstance(projects_res, dict):
        readiness_score = projects_res.get("portfolio_readiness", 0.0)
        recommended_projects = projects_res.get("projects", [])
    elif isinstance(projects_res, list):
        recommended_projects = projects_res
        readiness_score = action_plan_doc.get("job_readiness_score", 0.0) if action_plan_doc else 0.0
    else:
        recommended_projects = action_plan_doc.get("recommended_projects", []) if action_plan_doc else []
        readiness_score = action_plan_doc.get("job_readiness_score", 0.0) if action_plan_doc else 0.0

    completed_projects = [up.get("project_id") for up in user_prog_list if up.get("status") == "Completed"]
    in_progress_projects = [up.get("project_id") for up in user_prog_list if up.get("status") == "In Progress"]

    return {
        "user_id": user_id,
        "target_career": target_career,
        "current_skills": current_skills,
        "skill_gaps": skill_gaps,
        "portfolio_readiness": readiness_score,
        "recommended_projects": recommended_projects,
        "completed_projects": completed_projects,
        "in_progress_projects": in_progress_projects,
        "action_plan": action_plan_doc,
        "education": profile_doc.get("degree", "") if profile_doc else "",
        "work_style": profile_doc.get("work_style", "") if profile_doc else ""
    }

async def chat_with_assistant(user_id: str, message: str) -> Dict[str, Any]:
    """Process user message, generate AI career guidance, and persist conversation history."""
    if not message or not message.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message content cannot be empty."
        )

    # 1. Fetch user context
    context = await get_user_full_context(user_id)

    # 2. Fetch recent chat history for memory
    history = await get_assistant_chat_history(user_id, limit=10)

    # 3. Call AI layer
    res = await generate_career_assistant_response(
        user_message=message.strip(),
        user_context=context,
        chat_history=history
    )

    assistant_message = res.get("message", "")
    source = res.get("source", "ai")

    # 4. Save User Message
    now_iso = datetime.now(timezone.utc).isoformat()
    user_msg_doc = {
        "message_id": str(uuid.uuid4()),
        "user_id": user_id,
        "session_id": "default",
        "role": "user",
        "message": message.strip(),
        "created_at": now_iso
    }

    # 5. Save Assistant Response
    assistant_msg_doc = {
        "message_id": str(uuid.uuid4()),
        "user_id": user_id,
        "session_id": "default",
        "role": "assistant",
        "message": assistant_message,
        "created_at": datetime.now(timezone.utc).isoformat()
    }

    if db.is_connected and db.db is not None:
        await db.db.career_assistant_messages.insert_one(user_msg_doc.copy())
        await db.db.career_assistant_messages.insert_one(assistant_msg_doc.copy())
    else:
        in_memory_store.setdefault("career_assistant_messages", [])
        in_memory_store["career_assistant_messages"].append(user_msg_doc)
        in_memory_store["career_assistant_messages"].append(assistant_msg_doc)

    return {
        "success": True,
        "message": assistant_message,
        "source": source,
        "intent": res.get("intent", "general"),
        "next_action_card": res.get("next_action_card"),
        "recommended_skills": res.get("recommended_skills", []),
        "related_projects": res.get("related_projects", []),
        "suggested_questions": res.get("suggested_questions", res.get("dynamic_suggested_questions", [])),
        "dynamic_suggested_questions": res.get("dynamic_suggested_questions", res.get("suggested_questions", []))
    }


async def get_assistant_chat_history(user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
    """Retrieve chat history exclusively for the authenticated user."""
    messages = []
    if db.is_connected and db.db is not None:
        cursor = db.db.career_assistant_messages.find({"user_id": user_id}, {"_id": 0}).sort("created_at", 1).limit(limit)
        messages = await cursor.to_list(length=limit)
    else:
        all_msg = in_memory_store.get("career_assistant_messages", [])
        user_msg = [m for m in all_msg if m.get("user_id") == user_id]
        user_msg.sort(key=lambda x: x.get("created_at", ""))
        messages = user_msg[-limit:]

    return messages

async def clear_assistant_chat_history(user_id: str) -> Dict[str, Any]:
    """Delete chat history for the authenticated user."""
    if db.is_connected and db.db is not None:
        res = await db.db.career_assistant_messages.delete_many({"user_id": user_id})
        deleted_count = res.deleted_count
    else:
        all_msg = in_memory_store.get("career_assistant_messages", [])
        initial_len = len(all_msg)
        in_memory_store["career_assistant_messages"] = [m for m in all_msg if m.get("user_id") != user_id]
        deleted_count = initial_len - len(in_memory_store["career_assistant_messages"])

    return {
        "success": True,
        "message": f"Successfully deleted {deleted_count} message(s).",
        "deleted_count": deleted_count
    }
