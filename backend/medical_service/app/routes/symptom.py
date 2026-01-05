from datetime import datetime, timedelta
from typing import List, Optional

from app.core.database import get_database
from app.core.encryption import ENCRYPTED_FIELDS, encryption
from app.core.security import get_current_user_id
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

router = APIRouter()

class SymptomLog(BaseModel):
    symptoms: List[str] = Field(..., description="List of symptoms")
    severity: int = Field(ge=1, le=10, description="Overall severity 1-10")
    duration_hours: Optional[int] = Field(None, description="Duration in hours")
    notes: Optional[str] = ""

@router.post("/log")
async def log_symptoms(
    symptom_data: SymptomLog,
    user_id: str = Depends(get_current_user_id)
):
    """Log symptoms for tracking"""
    db = get_database()
    
    symptom_doc = {
        "user_id": user_id,
        "symptoms": symptom_data.symptoms,
        "severity": symptom_data.severity,
        "duration_hours": symptom_data.duration_hours,
        "notes": symptom_data.notes,
        "date": datetime.utcnow()
    }
    
    encrypted_doc = encryption.encrypt_dict(
        symptom_doc,
        ENCRYPTED_FIELDS.get("symptoms", [])
    )
    
    result = await db.symptoms.insert_one(encrypted_doc)
    
    return {
        "symptom_id": str(result.inserted_id),
        "message": "Symptoms logged successfully"
    }

@router.get("/history")
async def get_symptom_history(
    days: int = 30,
    user_id: str = Depends(get_current_user_id)
):
    """Get symptom history"""
    db = get_database()
    
    start_date = datetime.utcnow() - timedelta(days=days)
    cursor = db.symptoms.find({
        "user_id": user_id,
        "date": {"$gte": start_date}
    }).sort("date", -1)
    
    symptoms = await cursor.to_list(length=None)
    
    decrypted_symptoms = []
    for symptom in symptoms:
        symptom["_id"] = str(symptom["_id"])
        decrypted = encryption.decrypt_dict(
            symptom,
            ENCRYPTED_FIELDS.get("symptoms", [])
        )
        decrypted_symptoms.append(decrypted)
    
    return {
        "symptoms": decrypted_symptoms,
        "total_count": len(decrypted_symptoms)
    }


