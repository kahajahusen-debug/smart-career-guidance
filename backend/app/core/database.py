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
    "jobs": []
}

async def connect_to_mongo():
    try:
        db.client = AsyncIOMotorClient(settings.MONGODB_URL, serverSelectionTimeoutMS=2000)
        # Test connection ping
        await db.client.admin.command('ping')
        db.db = db.client[settings.MONGODB_DB_NAME]
        db.is_connected = True
        logger.info(f"Connected to MongoDB at {settings.MONGODB_URL} (Database: {settings.MONGODB_DB_NAME})")
    except Exception as e:
        db.is_connected = False
        db.db = None
        logger.warning(f"MongoDB connection failed: {str(e)}. Operating in fallback hybrid mode.")

async def close_mongo_connection():
    if db.client:
        db.client.close()
        logger.info("MongoDB connection closed.")
