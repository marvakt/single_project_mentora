"""
app/routes/summary.py - Medical Summary API
Provides consolidated medical history and insights
"""

import logging

from app.ai_engine.srts_scoring import SRTSEngine
from app.core.database import get_database
from app.core.security import get_current_user_id
from fastapi import APIRouter, Depends

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


@router.get("/user/{user_id}")
async def get_user_medical_summary(user_id: str):
    """
    Get comprehensive medical summary for a specific user
    Used by appointment service to provide patient data to doctors
    
    Args:
        user_id: The patient's user ID
    
    Returns:
        Medical summary including assessments, mood entries, and symptoms
    """
    db = get_database()
    
    try:
        # Get all severity assessments
        assessments_cursor = db.severity_logs.find(
            {"user_id": user_id}
        ).sort("created_at", -1)
        
        assessment_history = []
        latest_assessment = None
        
        async for assessment in assessments_cursor:
            assessment_data = {
                "severity_level": assessment.get("raw_score"),
                "created_at": assessment.get("created_at").isoformat() if assessment.get("created_at") else None,
                "severity_category": assessment.get("severity_level")
            }
            assessment_history.append(assessment_data)
            if latest_assessment is None:
                latest_assessment = assessment_data
        
        # Get all mood entries
        mood_cursor = db.mood_logs.find(
            {"user_id": user_id}
        ).sort("timestamp", -1)
        
        mood_entries = []
        async for mood in mood_cursor:
            mood_entries.append({
                "mood_score": mood.get("mood_level"),
                "anxiety_level": mood.get("anxiety_level", 5),
                "sleep_hours": mood.get("sleep_hours", 7),
                "energy_level": mood.get("energy_level", 5),
                "notes": mood.get("notes", ""),
                "created_at": mood.get("timestamp").isoformat() if mood.get("timestamp") else None
            })
        
        # Get recent symptoms
        symptoms_cursor = db.symptoms.find(
            {"user_id": user_id}
        ).sort("date", -1).limit(10)
        
        symptoms = []
        async for symptom in symptoms_cursor:
            symptoms.append({
                "symptom": symptom.get("symptom"),
                "severity": symptom.get("severity"),
                "date": symptom.get("date").isoformat() if symptom.get("date") else None
            })
        
        return {
            "latest_assessment": latest_assessment,
            "assessment_history": assessment_history,
            "mood_entries": mood_entries,
            "symptoms": symptoms
        }
        
    except Exception as e:
        logger.error(f"Error fetching medical summary for user {user_id}: {e}")
        return {
            "latest_assessment": None,
            "assessment_history": [],
            "mood_entries": [],
            "symptoms": []
        }