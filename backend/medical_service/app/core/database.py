"""
app/core/database.py - MongoDB Database Connection
"""

from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# Global database client and database instance
mongodb_client: AsyncIOMotorClient = None
database = None


async def connect_db():
    """Connect to MongoDB"""
    global mongodb_client, database
    
    try:
        mongodb_client = AsyncIOMotorClient(settings.MONGO_URI)
        database = mongodb_client[settings.MONGO_DB]
        
        # Test connection
        await mongodb_client.admin.command('ping')
        logger.info(f"✅ Connected to MongoDB: {settings.MONGO_DB}")
        
        # Create indexes
        await create_indexes()
        
    except Exception as e:
        logger.error(f"❌ Failed to connect to MongoDB: {e}")
        raise


async def close_db():
    """Close MongoDB connection"""
    global mongodb_client
    
    if mongodb_client:
        mongodb_client.close()
        logger.info("✅ MongoDB connection closed")


async def create_indexes():
    """Create database indexes for optimal performance"""
    try:
        # Severity logs indexes
        await database.severity_logs.create_index("user_id")
        await database.severity_logs.create_index([("user_id", 1), ("created_at", -1)])
        
        # Mood logs indexes
        await database.mood_logs.create_index("user_id")
        await database.mood_logs.create_index([("user_id", 1), ("timestamp", -1)])
        
        # Symptoms indexes
        await database.symptoms.create_index("user_id")
        await database.symptoms.create_index([("user_id", 1), ("date", -1)])
        
        # Chat messages indexes
        await database.chat_messages.create_index([("room_id", 1), ("timestamp", -1)])
        await database.chat_messages.create_index("user_id")
        await database.chat_messages.create_index("doctor_id")
        # Unique compound index for idempotency
        await database.chat_messages.create_index(
            [("room_id", 1), ("client_message_id", 1)], 
            unique=True,
            sparse=True  # Allow null client_message_id for legacy messages
        )        
        # Treatment plans indexes
        await database.treatment_plans.create_index("user_id")
        await database.treatment_plans.create_index([("user_id", 1), ("created_at", -1)])
        
        # Session notes indexes
        await database.session_notes.create_index([("appointment_id", 1)])
        await database.session_notes.create_index([("user_id", 1), ("created_at", -1)])
        
        # Crisis events indexes
        await database.crisis_events.create_index([("user_id", 1), ("timestamp", -1)])
        await database.crisis_events.create_index("timestamp")
        
        logger.info("✅ Database indexes created")        
    except Exception as e:
        logger.error(f"❌ Failed to create indexes: {e}")


def get_database():
    """Get database instance"""
    return database