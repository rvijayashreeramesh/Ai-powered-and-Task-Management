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
        client_kwargs = {
            "serverSelectionTimeoutMS": 10000,
        }
        if settings.mongodb_url.startswith("mongodb+srv://") or "tls=true" in settings.mongodb_url.lower():
            client_kwargs["tlsCAFile"] = certifi.where()

        db_instance.client = AsyncIOMotorClient(settings.mongodb_url, **client_kwargs)

        # Resolve default database from connection string if provided, else use settings.mongodb_database
        try:
            default_db = db_instance.client.get_default_database()
            if default_db is not None:
                db_instance.db = default_db
            else:
                db_instance.db = db_instance.client[settings.mongodb_database]
        except Exception:
            db_instance.db = db_instance.client[settings.mongodb_database]

        # Verify connection
        await db_instance.client.admin.command('ping')
        logger.info("Successfully connected to MongoDB database '%s'.", db_instance.db.name)
    except Exception as e:
        logger.error(f"Error connecting to MongoDB: {e}")
        # Do not expose credentials in the error message
        raise e

async def close_mongo_connection():
    if db_instance.client:
        logger.info("Closing MongoDB connection...")
        db_instance.client.close()
        logger.info("MongoDB connection closed.")
