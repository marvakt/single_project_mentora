"""
app/routes/summary.py - Medical Summary API
Provides consolidated medical history and insights
"""

from fastapi import APIRouter, Depends
from app.core.security import get_current_user_id
from app.core.database import get_database
from app.ai_engine.srts_scoring import SRTSEngine
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/")
async def get_medical_summary(
    user_id: str = Depends(get_current_user_id)
):
    """
    Get comprehensive medical summary for user
    
    Returns:
        Consolidated view of user's mental health history including:
        - Latest severity assessment
        - Recent mood trends
        - Symptom history
        - Treatment progress
    """
    db = get_database()
    
    try:
        # Get latest severity assessment
        latest_severity = await db.severity_logs.find_one(
            {"user_id": user_id},
            sort=[("created_at", -1)]
        )
        
        # Get recent mood logs (last 7 days)
        from datetime import datetime, timedelta
        week_ago = datetime.utcnow() - timedelta(days=7)
        
        recent_moods_cursor = db.mood_logs.find({
            "user_id": user_id,
            "timestamp": {"$gte": week_ago}
        }).sort("timestamp", -1).limit(7)
        
        recent_moods = []
        async for mood in recent_moods_cursor:
            recent_moods.append({
                "mood_level": mood.get("mood_level"),
                "timestamp": mood.get("timestamp"),
                "notes": mood.get("notes")
            })
        
        # Get recent symptoms
        recent_symptoms_cursor = db.symptoms.find({
            "user_id": user_id
        }).sort("date", -1).limit(10)
        
        recent_symptoms = []
        async for symptom in recent_symptoms_cursor:
            recent_symptoms.append({
                "symptom": symptom.get("symptom"),
                "severity": symptom.get("severity"),
                "date": symptom.get("date")
            })
        
        # Get active treatment plans
        active_treatments_cursor = db.treatment_plans.find({
            "user_id": user_id,
            "status": "active"
        }).sort("created_at", -1)
        
        active_treatments = []
        async for treatment in active_treatments_cursor:
            active_treatments.append({
                "title": treatment.get("title"),
                "created_at": treatment.get("created_at"),
                "progress": treatment.get("progress", 0)
            })
        
        summary = {
            "latest_severity": {
                "score": latest_severity.get("raw_score") if latest_severity else None,
                "level": latest_severity.get("severity_level") if latest_severity else None,
                "assessed_at": latest_severity.get("created_at") if latest_severity else None
            } if latest_severity else None,
            "recent_moods": recent_moods,
            "recent_symptoms": recent_symptoms,
            "active_treatments": active_treatments,
            "insights": SRTSEngine.analyze_trends([latest_severity] if latest_severity else [])
        }
        
        return {
            "success": True,
            "data": summary
        }
        
    except Exception as e:
        logger.error(f"Error generating medical summary for user {user_id}: {e}")
        return {
            "success": False,
            "error": "Failed to generate medical summary"
        }