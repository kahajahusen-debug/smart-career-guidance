from typing import Optional
from fastapi import APIRouter, Query
from app.core.database import db, in_memory_store

router = APIRouter()

@router.get("/projects", summary="List Recommended Portfolio Projects")
async def get_projects(category: Optional[str] = Query(None)):
    cat_str = category if isinstance(category, str) else None
    
    if db.is_connected and db.db is not None:
        query = {}
        if cat_str and cat_str.lower() != "all":
            query["category"] = {"$regex": f"^{cat_str}$", "$options": "i"}
        cursor = db.db.projects.find(query, {"_id": 0})
        projects = await cursor.to_list(length=100)
    else:
        projects = in_memory_store.get("projects", [])
        if cat_str and cat_str.lower() != "all":
            projects = [p for p in projects if p.get("category", "").lower() == cat_str.lower()]

    return {"total": len(projects), "projects": projects}
