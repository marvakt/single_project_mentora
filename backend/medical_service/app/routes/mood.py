"""
app/routes/mood.py - Mood Tracking API
Daily mood logging and analysis
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List
from app.core.security import get_current_user_id
from app.core.database import get_database
from app.core.encryption import encryption, ENCRYPTED_FIELDS
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


# Request/Response Models
class MoodLog(BaseModel):
    """Mood log entry"""
    mood_level: int = Field(..., ge=1, le=10, description="Mood level 1-10")
    energy_level: int = Field(..., ge=1, le=10, description="Energy level 1-10")
    stress_level: int = Field(..., ge=1, le=10, description="Stress level 1-10")
    sleep_quality: int = Field(..., ge=1, le=10, description="Sleep quality 1-10")
    notes: Optional[str] = Field(default="", description="Optional notes")
    triggers: Optional[str] = Field(default="", description="Identified triggers")


@router.post("/log")
async def create_mood_log(
    mood_data: MoodLog,
    user_id: str = Depends(get_current_user_id)
):
    """
    Create a new mood log entry
    
    Records daily mood, energy, stress, and sleep quality
    """
    db = get_database()
    
    # Prepare mood log document
    mood_log = {
        "user_id": user_id,
        "mood_level": mood_data.mood_level,
        "energy_level": mood_data.energy_level,
        "stress_level": mood_data.stress_level,
        "sleep_quality": mood_data.sleep_quality,
        "notes": mood_data.notes,
        "triggers": mood_data.triggers,
        "timestamp": datetime.utcnow()
    }
    
    # Encrypt sensitive fields
    encrypted_log = encryption.encrypt_dict(
        mood_log,
        ENCRYPTED_FIELDS.get("mood_logs", [])
    )
    
    # Store in database
    result = await db.mood_logs.insert_one(encrypted_log)
    
    logger.info(f"Mood log created for user {user_id}")
    
    return {
        "mood_log_id": str(result.inserted_id),
        "message": "Mood logged successfully",
        "timestamp": mood_log["timestamp"].isoformat()
    }


@router.get("/history")
async def get_mood_history(
    days: int = 30,
    user_id: str = Depends(get_current_user_id)
):
    """
    Get mood history for specified number of days
    
    Returns mood logs with trend analysis
    """
    db = get_database()
    
    # Calculate date range
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Fetch mood logs
    cursor = db.mood_logs.find({
        "user_id": user_id,
        "timestamp": {"$gte": start_date}
    }).sort("timestamp", -1)
    
    logs = await cursor.to_list(length=None)
    
    # Decrypt logs
    decrypted_logs = []
    for log in logs:
        log["_id"] = str(log["_id"])
        decrypted_log = encryption.decrypt_dict(
            log,
            ENCRYPTED_FIELDS.get("mood_logs", [])
        )
        decrypted_logs.append(decrypted_log)
    
    # Calculate analytics
    analytics = _calculate_mood_analytics(decrypted_logs)
    
    return {
        "mood_logs": decrypted_logs,
        "total_count": len(decrypted_logs),
        "analytics": analytics
    }


@router.get("/insights")
async def get_mood_insights(
    user_id: str = Depends(get_current_user_id)
):
    """
    Get AI-powered mood insights and recommendations
    
    Analyzes mood patterns and provides personalized guidance
    """
    db = get_database()
    
    # Get last 30 days of mood data
    start_date = datetime.utcnow() - timedelta(days=30)
    cursor = db.mood_logs.find({
        "user_id": user_id,
        "timestamp": {"$gte": start_date}
    }).sort("timestamp", 1)
    
    logs = await cursor.to_list(length=None)
    
    if not logs:
        return {
            "insights": [],
            "message": "Not enough data. Keep logging your mood daily!"
        }
    
    # Decrypt logs
    decrypted_logs = []
    for log in logs:
        decrypted_logs.append(
            encryption.decrypt_dict(log, ENCRYPTED_FIELDS.get("mood_logs", []))
        )
    
    # Generate insights
    insights = _generate_mood_insights(decrypted_logs)
    
    return {
        "insights": insights,
        "data_period": f"Last {len(decrypted_logs)} days"
    }


@router.post("/quick-mood")
async def log_quick_mood(
    mood_emoji: str = Field(..., description="Mood emoji: happy, sad, calm, angry, anxious, tired, excited, upset"),
    user_id: str = Depends(get_current_user_id)
):
    """
    Quick mood logging using emoji selection
    
    Maps emojis to mood levels for quick daily tracking
    """
    db = get_database()
    
    # Map emojis to mood levels
    mood_mapping = {
        "happy": {"mood_level": 9, "energy_level": 8, "stress_level": 2, "sleep_quality": 8},
        "calm": {"mood_level": 7, "energy_level": 6, "stress_level": 3, "sleep_quality": 7},
        "sad": {"mood_level": 3, "energy_level": 4, "stress_level": 5, "sleep_quality": 5},
        "angry": {"mood_level": 2, "energy_level": 7, "stress_level": 9, "sleep_quality": 4},
        "anxious": {"mood_level": 3, "energy_level": 5, "stress_level": 8, "sleep_quality": 4},
        "tired": {"mood_level": 4, "energy_level": 3, "stress_level": 4, "sleep_quality": 6},
        "excited": {"mood_level": 8, "energy_level": 9, "stress_level": 3, "sleep_quality": 7},
        "upset": {"mood_level": 2, "energy_level": 4, "stress_level": 7, "sleep_quality": 5},
    }
    
    if mood_emoji not in mood_mapping:
        raise HTTPException(status_code=400, detail=f"Invalid mood emoji. Valid options: {list(mood_mapping.keys())}")
    
    mood_data = mood_mapping[mood_emoji]
    
    # Prepare mood log document
    mood_log = {
        "user_id": user_id,
        "mood_level": mood_data["mood_level"],
        "energy_level": mood_data["energy_level"],
        "stress_level": mood_data["stress_level"],
        "sleep_quality": mood_data["sleep_quality"],
        "notes": f"Quick mood entry: {mood_emoji}",
        "triggers": "",
        "timestamp": datetime.utcnow(),
        "entry_type": "quick_mood"  # Mark as quick mood entry
    }
    
    # Encrypt sensitive fields
    encrypted_log = encryption.encrypt_dict(
        mood_log,
        ENCRYPTED_FIELDS.get("mood_logs", [])
    )
    
    # Store in database
    result = await db.mood_logs.insert_one(encrypted_log)
    
    logger.info(f"Quick mood logged for user {user_id}: {mood_emoji}")
    
    return {
        "mood_log_id": str(result.inserted_id),
        "message": f"Mood '{mood_emoji}' logged successfully",
        "timestamp": mood_log["timestamp"].isoformat()
    }


@router.get("/quick-mood")
async def log_quick_mood_get(
    mood: str,
    user_id: str = Depends(get_current_user_id)
):
    """
    GET endpoint for quick mood logging via email links
    
    Allows users to click mood links directly from emails
    """
    # This calls the same logic as the POST endpoint
    db = get_database()
    
    # Map emojis to mood levels
    mood_mapping = {
        "happy": {"mood_level": 9, "energy_level": 8, "stress_level": 2, "sleep_quality": 8},
        "calm": {"mood_level": 7, "energy_level": 6, "stress_level": 3, "sleep_quality": 7},
        "sad": {"mood_level": 3, "energy_level": 4, "stress_level": 5, "sleep_quality": 5},
        "angry": {"mood_level": 2, "energy_level": 7, "stress_level": 9, "sleep_quality": 4},
        "anxious": {"mood_level": 3, "energy_level": 5, "stress_level": 8, "sleep_quality": 4},
        "tired": {"mood_level": 4, "energy_level": 3, "stress_level": 4, "sleep_quality": 6},
        "excited": {"mood_level": 8, "energy_level": 9, "stress_level": 3, "sleep_quality": 7},
        "upset": {"mood_level": 2, "energy_level": 4, "stress_level": 7, "sleep_quality": 5},
    }
    
    if mood not in mood_mapping:
        raise HTTPException(status_code=400, detail=f"Invalid mood. Valid options: {list(mood_mapping.keys())}")
    
    mood_data = mood_mapping[mood]
    
    # Prepare mood log document
    mood_log = {
        "user_id": user_id,
        "mood_level": mood_data["mood_level"],
        "energy_level": mood_data["energy_level"],
        "stress_level": mood_data["stress_level"],
        "sleep_quality": mood_data["sleep_quality"],
        "notes": f"Quick mood entry: {mood}",
        "triggers": "",
        "timestamp": datetime.utcnow(),
        "entry_type": "quick_mood"  # Mark as quick mood entry
    }
    
    # Encrypt sensitive fields
    encrypted_log = encryption.encrypt_dict(
        mood_log,
        ENCRYPTED_FIELDS.get("mood_logs", [])
    )
    
    # Store in database
    result = await db.mood_logs.insert_one(encrypted_log)
    
    logger.info(f"Quick mood logged for user {user_id}: {mood}")
    
    # Return a response that can be shown in browser
    return {
        "mood_log_id": str(result.inserted_id),
        "message": f"Mood '{mood}' logged successfully! Thank you for tracking your mood.",
        "timestamp": mood_log["timestamp"].isoformat()
    }


def _calculate_mood_analytics(logs: List[dict]) -> dict:
    """Calculate mood analytics from logs"""
    if not logs:
        return {}
    
    moods = [log["mood_level"] for log in logs]
    energy = [log["energy_level"] for log in logs]
    stress = [log["stress_level"] for log in logs]
    sleep = [log["sleep_quality"] for log in logs]
    
    return {
        "average_mood": round(sum(moods) / len(moods), 2),
        "average_energy": round(sum(energy) / len(energy), 2),
        "average_stress": round(sum(stress) / len(stress), 2),
        "average_sleep": round(sum(sleep) / len(sleep), 2),
        "mood_trend": _calculate_trend(moods),
        "energy_trend": _calculate_trend(energy),
        "lowest_mood_day": min(moods),
        "highest_mood_day": max(moods)
    }


def _calculate_trend(values: List[int]) -> str:
    """Calculate trend from values"""
    if len(values) < 2:
        return "stable"
    
    first_half = values[:len(values)//2]
    second_half = values[len(values)//2:]
    
    avg_first = sum(first_half) / len(first_half)
    avg_second = sum(second_half) / len(second_half)
    
    diff = avg_second - avg_first
    
    if diff > 1:
        return "improving"
    elif diff < -1:
        return "declining"
    else:
        return "stable"


def _generate_mood_insights(logs: List[dict]) -> List[str]:
    """Generate personalized mood insights"""
    insights = []
    
    if not logs:
        return insights
    
    # Recent mood analysis
    recent_moods = [log["mood_level"] for log in logs[-7:]]
    avg_mood = sum(recent_moods) / len(recent_moods)
    
    if avg_mood < 4:
        insights.append("😔 Your mood has been low recently. Consider reaching out to your therapist.")
    elif avg_mood > 7:
        insights.append("😊 Great! Your mood has been consistently positive.")
    
    # Energy analysis
    recent_energy = [log["energy_level"] for log in logs[-7:]]
    avg_energy = sum(recent_energy) / len(recent_energy)
    
    if avg_energy < 4:
        insights.append("⚡ Low energy detected. Ensure adequate sleep and nutrition.")
    
    # Stress analysis
    recent_stress = [log["stress_level"] for log in logs[-7:]]
    avg_stress = sum(recent_stress) / len(recent_stress)
    
    if avg_stress > 7:
        insights.append("😰 High stress levels detected. Try relaxation techniques like deep breathing.")
    
    # Sleep analysis
    recent_sleep = [log["sleep_quality"] for log in logs[-7:]]
    avg_sleep = sum(recent_sleep) / len(recent_sleep)
    
    if avg_sleep < 5:
        insights.append("😴 Poor sleep quality. Establish a consistent bedtime routine.")
    
    # Pattern detection
    if len(logs) >= 14:
        mood_trend = _calculate_trend([log["mood_level"] for log in logs])
        if mood_trend == "declining":
            insights.append("⚠️ Your mood shows a declining trend. Discuss this with your therapist.")
        elif mood_trend == "improving":
            insights.append("✅ Positive trend! Your mood is improving over time.")
    
    return insights