from typing import Optional
from fastapi import APIRouter, Query
from app.core.database import db, in_memory_store

router = APIRouter()

@router.get("/jobs", summary="List Sample Job Postings with LinkedIn/Naukri direct links")
async def get_jobs(category: Optional[str] = Query(None)):
    cat_str = category if isinstance(category, str) else None
    
    if db.is_connected and db.db is not None:
        query = {}
        if cat_str and cat_str.lower() != "all":
            query["category"] = {"$regex": f"^{cat_str}$", "$options": "i"}
        cursor = db.db.jobs.find(query, {"_id": 0})
        jobs = await cursor.to_list(length=100)
    else:
        jobs = in_memory_store.get("jobs", [])
        if cat_str and cat_str.lower() != "all":
            jobs = [j for j in jobs if j.get("category", "").lower() == cat_str.lower()]

    return {"total": len(jobs), "jobs": jobs}
