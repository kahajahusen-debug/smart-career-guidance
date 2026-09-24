from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from app.core.database import db, in_memory_store

router = APIRouter()

@router.get("/careers", summary="List All Career Profiles (Filtered by Category IT / Non-IT)")
async def get_careers(category: Optional[str] = Query(None, description="Filter by IT or Non-IT")):
    cat_str = category if isinstance(category, str) else None
    
    if db.is_connected and db.db is not None:
        query = {}
        if cat_str and cat_str.lower() != "all":
            query["category"] = {"$regex": f"^{cat_str}$", "$options": "i"}
        cursor = db.db.careers.find(query, {"_id": 0})
        careers = await cursor.to_list(length=100)
    else:
        careers = in_memory_store.get("careers", [])
        if cat_str and cat_str.lower() != "all":
            careers = [c for c in careers if c.get("category", "").lower() == cat_str.lower()]
            
    return {"total": len(careers), "careers": careers}

@router.get("/careers/{career_id}", summary="Get Career Detail by ID")
async def get_career_by_id(career_id: str):
    if db.is_connected and db.db is not None:
        career = await db.db.careers.find_one({"id": career_id}, {"_id": 0})
    else:
        career = next((c for c in in_memory_store.get("careers", []) if c.get("id") == career_id), None)
        
    if not career:
        raise HTTPException(status_code=404, detail=f"Career profile '{career_id}' not found.")
    return career
