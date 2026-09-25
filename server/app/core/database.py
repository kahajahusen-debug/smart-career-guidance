import logging
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

logger = logging.getLogger("uvicorn")

class Database:
    client: AsyncIOMotorClient = None
    db = None
    is_connected: bool = False

db = Database()

# InMemory Fallback Store for seamless local testing without mandatory MongoDB daemon
in_memory_store = {
    "careers": [],
    "skills": [],
    "questions": [],
    "projects": [],
    "jobs": [],
    "users": [],
    "profiles": {},
    "assessment_results": {}
}

async def connect_to_mongo():
    try:
        db.client = AsyncIOMotorClient(settings.MONGODB_URL, serverSelectionTimeoutMS=2000)
        # Test connection ping
        await db.client.admin.command('ping')
        db.db = db.client[settings.MONGODB_DB_NAME]
        db.is_connected = True
        logger.info(f"Connected to MongoDB at {settings.MONGODB_URL} (Database: {settings.MONGODB_DB_NAME})")

        # Create indexes for performance and unique email constraint
        try:
            await db.db.users.create_index("email", unique=True)
            await db.db.profiles.create_index("user_id", unique=True)
            await db.db.assessment_results.create_index("user_id")
            logger.info("MongoDB indexes verified on users, profiles, and assessment_results.")
        except Exception as idx_err:
            logger.warning(f"Error initializing MongoDB indexes: {idx_err}")

    except Exception as e:
        db.is_connected = False
        db.db = None
        logger.warning(f"MongoDB connection failed: {str(e)}. Operating in fallback hybrid mode.")


async def close_mongo_connection():
    if db.client:
        db.client.close()
        logger.info("MongoDB connection closed.")
