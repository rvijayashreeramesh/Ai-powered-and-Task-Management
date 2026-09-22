from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
import certifi
import logging

logger = logging.getLogger(__name__)

class MongoDB:
    client: AsyncIOMotorClient = None
    db = None

db_instance = MongoDB()

async def connect_to_mongo():
    try:
        logger.info("Connecting to MongoDB...")
        client_kwargs = {}
        if settings.mongodb_url.startswith("mongodb+srv://") or "tls=true" in settings.mongodb_url.lower():
            client_kwargs["tlsCAFile"] = certifi.where()

        db_instance.client = AsyncIOMotorClient(settings.mongodb_url, **client_kwargs)
        db_instance.db = db_instance.client[settings.mongodb_database]
        # Verify connection
        await db_instance.client.admin.command('ping')
        logger.info("Successfully connected to MongoDB.")
    except Exception as e:
        logger.error(f"Error connecting to MongoDB: {e}")
        # Do not expose credentials in the error message
        raise e

async def close_mongo_connection():
    if db_instance.client:
        logger.info("Closing MongoDB connection...")
        db_instance.client.close()
        logger.info("MongoDB connection closed.")
