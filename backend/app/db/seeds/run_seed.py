import asyncio
import logging
from app.core.database import db, connect_to_mongo, in_memory_store
from app.db.seeds.seed_data import CAREERS_SEED, QUESTIONS_SEED, PROJECTS_SEED, JOBS_SEED

logger = logging.getLogger("uvicorn")

async def seed_database():
    await connect_to_mongo()
    
    # Populate In-Memory store as default baseline
    in_memory_store["careers"] = CAREERS_SEED
    in_memory_store["questions"] = QUESTIONS_SEED
    in_memory_store["projects"] = PROJECTS_SEED
    in_memory_store["jobs"] = JOBS_SEED

    if db.is_connected and db.db is not None:
        logger.info("Seeding MongoDB database...")
        # Clear existing collections to keep seed clean
        await db.db.careers.delete_many({})
        await db.db.questions.delete_many({})
        await db.db.projects.delete_many({})
        await db.db.jobs.delete_many({})

        # Insert fresh seed documents
        if CAREERS_SEED:
            await db.db.careers.insert_many(CAREERS_SEED)
        if QUESTIONS_SEED:
            await db.db.questions.insert_many(QUESTIONS_SEED)
        if PROJECTS_SEED:
            await db.db.projects.insert_many(PROJECTS_SEED)
        if JOBS_SEED:
            await db.db.jobs.insert_many(JOBS_SEED)

        logger.info(f"MongoDB seeded successfully with {len(CAREERS_SEED)} careers, {len(QUESTIONS_SEED)} questions!")
        return {
            "status": "success",
            "storage": "MongoDB",
            "careers_count": len(CAREERS_SEED),
            "questions_count": len(QUESTIONS_SEED),
            "projects_count": len(PROJECTS_SEED),
            "jobs_count": len(JOBS_SEED)
        }
    else:
        logger.info(f"In-Memory store seeded with {len(CAREERS_SEED)} careers and {len(QUESTIONS_SEED)} questions.")
        return {
            "status": "success",
            "storage": "InMemory (MongoDB offline)",
            "careers_count": len(CAREERS_SEED),
            "questions_count": len(QUESTIONS_SEED),
            "projects_count": len(PROJECTS_SEED),
            "jobs_count": len(JOBS_SEED)
        }

if __name__ == "__main__":
    asyncio.run(seed_database())
