from datetime import datetime
from fastapi import APIRouter
from app.core.config import settings
from app.core.database import db, in_memory_store

router = APIRouter()

@router.get("/health", summary="Basic FastAPI System Health Check")
async def health_check():
    """
    Returns system status, environment details, database connectivity state,
    and available seed counts for IT & Non-IT careers and assessment questions.
    """
    mongo_status = "connected" if db.is_connected else "offline (using in-memory fallback)"
    
    # Calculate counts
    if db.is_connected and db.db is not None:
        careers_count = await db.db.careers.count_documents({})
        questions_count = await db.db.questions.count_documents({})
    else:
        careers_count = len(in_memory_store.get("careers", []))
        questions_count = len(in_memory_store.get("questions", []))

    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
        "database_status": mongo_status,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "stats": {
            "total_careers": careers_count,
            "total_questions": questions_count
        }
    }
