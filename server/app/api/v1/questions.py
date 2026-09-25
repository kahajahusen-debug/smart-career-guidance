from typing import Optional
from fastapi import APIRouter, Query
from app.core.database import db, in_memory_store
from app.services.assessment_service import load_questions_dataset

router = APIRouter()

@router.get("/questions", summary="List Assessment Questions (Filtered by Difficulty/Category/Skill)")
async def get_questions(
    category: Optional[str] = Query(None, description="Filter by IT or Non-IT"),
    difficulty: Optional[int] = Query(None, ge=1, le=5, description="Filter by difficulty 1 to 5"),
    skill_name: Optional[str] = Query(None, description="Filter by specific skill name"),
    skill_category: Optional[str] = Query(None, description="Filter by skill category (Programming, Database / SQL, etc.)")
):
    cat_str = category if isinstance(category, str) else None
    diff_val = difficulty if isinstance(difficulty, int) else None
    skill_str = skill_name if isinstance(skill_name, str) else None
    sk_cat_str = skill_category if isinstance(skill_category, str) else None

    questions = []
    if db.is_connected and db.db is not None:
        query = {}
        if cat_str and cat_str.lower() != "all":
            query["category"] = {"$regex": f"^{cat_str}$", "$options": "i"}
        if diff_val:
            query["difficulty"] = diff_val
        if skill_str:
            query["skill_name"] = {"$regex": f"^{skill_str}$", "$options": "i"}
        if sk_cat_str:
            query["skill_category"] = {"$regex": f"^{sk_cat_str}$", "$options": "i"}
            
        cursor = db.db.questions.find(query, {"_id": 0})
        questions = await cursor.to_list(length=500)

    if not questions:
        # Fallback to in_memory_store or dataset
        questions = in_memory_store.get("questions", [])
        if not questions:
            questions = load_questions_dataset()

        if cat_str and cat_str.lower() != "all":
            questions = [q for q in questions if q.get("category", "").lower() == cat_str.lower()]
        if diff_val:
            questions = [q for q in questions if q.get("difficulty") == diff_val]
        if skill_str:
            questions = [q for q in questions if q.get("skill_name", "").lower() == skill_str.lower()]
        if sk_cat_str:
            questions = [q for q in questions if q.get("skill_category", "").lower() == sk_cat_str.lower()]

    return {"total": len(questions), "questions": questions}
