"""
app/core/database.py - MongoDB Database Connection
"""

import logging

from app.core.config import settings
from motor.motor_asyncio import AsyncIOMotorClient

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
        
        # Recommendation snapshots indexes
        await database.recommendation_snapshots.create_index("user_id")
        await database.recommendation_snapshots.create_index([("user_id", 1), ("created_at", -1)])
        await database.recommendation_snapshots.create_index("assessment_id")
        await database.recommendation_snapshots.create_index("snapshot_id", unique=True)
        
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
        
        # AI conversations indexes (for fallback if AI chat was used)
        await database.ai_conversations.create_index("user_id")
        await database.ai_conversations.create_index([("user_id", 1), ("timestamp", -1)])
        
        # Session summaries indexes (for if/when session summaries are added)
        await database.session_summaries.create_index("appointment_id")
        await database.session_summaries.create_index("doctor_id")
        await database.session_summaries.create_index([("appointment_id", 1), ("created_at", -1)])
        
        logger.info("✅ Database indexes created")        
    except Exception as e:
        logger.error(f"❌ Failed to create indexes: {e}")


def get_database():
    """Get database instance"""
    return database


async def create_recommendation_snapshot(user_id: str, assessment_id: str, triage_profile: dict, suggested_doctors: list):
    """
    Create a deterministic recommendation snapshot for consistent UX.
    
    Args:
        user_id: User ID
        assessment_id: Assessment ID
        triage_profile: Triage profile used for recommendations
        suggested_doctors: List of suggested doctors
    
    Returns:
        str: Snapshot ID
    """
    global database
    if database is None:
        raise RuntimeError("Database not initialized. Call connect_db() first.")
    
    import uuid
    from datetime import datetime, timedelta
    
    snapshot_id = str(uuid.uuid4())
    
    snapshot_doc = {
        "snapshot_id": snapshot_id,
        "user_id": user_id,
        "assessment_id": assessment_id,
        "triage_profile": triage_profile,
        "suggested_doctors": suggested_doctors,
        "created_at": datetime.utcnow(),
        "expires_at": datetime.utcnow().replace(hour=23, minute=59, second=59, microsecond=999999) + timedelta(days=1)  # Expires in 24 hours
    }
    
    # Create the recommendation_snapshots collection and insert the document
    result = await database.recommendation_snapshots.insert_one(snapshot_doc)
    
    logger.info(f"Created recommendation snapshot {snapshot_id} for user {user_id}")
    
    return snapshot_id


async def get_recommendation_snapshot(snapshot_id: str):
    """
    Retrieve a recommendation snapshot by ID.
    
    Args:
        snapshot_id: ID of the snapshot to retrieve
    
    Returns:
        dict: Snapshot data or None if not found
    """
    global database
    if database is None:
        raise RuntimeError("Database not initialized. Call connect_db() first.")
    
    snapshot = await database.recommendation_snapshots.find_one({"snapshot_id": snapshot_id})
    
    if snapshot:
        logger.info(f"Retrieved recommendation snapshot {snapshot_id}")
    else:
        logger.warning(f"Recommendation snapshot {snapshot_id} not found")
    
    return snapshot