from fastapi import APIRouter
from app.db.seeds.run_seed import seed_database
from app.core.database import db, in_memory_store

router = APIRouter()

@router.post("/seed", summary="Trigger Database Seeding")
async def trigger_seed():
    """Populates MongoDB or In-Memory store with IT & Non-IT seed dataset."""
    result = await seed_database()
    return result

@router.get("/seed/stats", summary="Get Current Dataset Stats")
async def seed_stats():
    """Returns total loaded careers, questions, jobs, and projects."""
    if db.is_connected and db.db is not None:
        c_count = await db.db.careers.count_documents({})
        q_count = await db.db.questions.count_documents({})
        j_count = await db.db.jobs.count_documents({})
        p_count = await db.db.projects.count_documents({})
        storage = "MongoDB"
    else:
        c_count = len(in_memory_store.get("careers", []))
        q_count = len(in_memory_store.get("questions", []))
        j_count = len(in_memory_store.get("jobs", []))
        p_count = len(in_memory_store.get("projects", []))
        storage = "InMemory Store"

    return {
        "storage": storage,
        "careers_count": c_count,
        "questions_count": q_count,
        "jobs_count": j_count,
        "projects_count": p_count
    }
