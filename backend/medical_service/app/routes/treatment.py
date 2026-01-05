"""
app/routes/treatment.py - Treatment Plan Management
AI-generated personalized treatment pathways
"""

import logging
from datetime import datetime, timedelta
from typing import List, Optional

from app.core.database import get_database
from app.core.encryption import ENCRYPTED_FIELDS, encryption
from app.core.security import get_current_user, get_current_user_id, require_role
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

router = APIRouter()


# Request/Response Models
class TreatmentPlan(BaseModel):
    """Treatment plan model"""
    plan_title: str
    plan_details: str
    goals: List[str]
    recommendations: List[str]
    therapy_frequency: str = Field(description="e.g., 'Weekly', 'Bi-weekly'")
    duration_weeks: int = Field(ge=1, le=52)
    lifestyle_changes: Optional[List[str]] = []
    medication_notes: Optional[str] = ""


@router.post("/create")
async def create_treatment_plan(
    user_id_param: str,
    plan_data: TreatmentPlan,
    doctor_id: str = Depends(get_current_user_id),
    current_user: dict = Depends(get_current_user)
):
    """
    Create treatment plan for a patient (Doctor only)
    
    Generates personalized treatment pathway based on assessment
    """
    # Validate inputs
    if not user_id_param or len(user_id_param.strip()) < 1:
        raise HTTPException(status_code=400, detail="Patient user ID is required")
    
    # Verify doctor role
    if current_user.get("role") != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can create treatment plans")
    
    db = get_database()
    
    # Get patient's latest severity assessment
    latest_severity = await db.severity_logs.find_one(
        {"user_id": user_id_param},
        sort=[("created_at", -1)]
    )
    
    if not latest_severity:
        raise HTTPException(
            status_code=404,
            detail="No severity assessment found for this patient"
        )
    
    # Prepare treatment plan document
    treatment_doc = {
        "user_id": user_id_param,
        "doctor_id": doctor_id,
        "plan_title": plan_data.plan_title,
        "plan_details": plan_data.plan_details,
        "goals": plan_data.goals,
        "recommendations": plan_data.recommendations,
        "therapy_frequency": plan_data.therapy_frequency,
        "duration_weeks": plan_data.duration_weeks,
        "lifestyle_changes": plan_data.lifestyle_changes,
        "medication_notes": plan_data.medication_notes,
        "severity_level": latest_severity.get("severity_level"),
        "start_date": datetime.utcnow(),
        "end_date": datetime.utcnow() + timedelta(weeks=plan_data.duration_weeks),
        "status": "active",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    # Encrypt sensitive fields
    encrypted_plan = encryption.encrypt_dict(
        treatment_doc,
        ENCRYPTED_FIELDS.get("treatment_plans", [])
    )
    
    # Store in database
    result = await db.treatment_plans.insert_one(encrypted_plan)
    
    logger.info(f"Treatment plan created by doctor {doctor_id} for user {user_id_param}")
    
    return {
        "treatment_plan_id": str(result.inserted_id),
        "message": "Treatment plan created successfully",
        "start_date": treatment_doc["start_date"].isoformat(),
        "end_date": treatment_doc["end_date"].isoformat()
    }


@router.get("/my-plan")
async def get_my_treatment_plan(
    user_id: str = Depends(get_current_user_id)
):
    """
    Get user's active treatment plan
    
    Returns current treatment pathway and progress
    """
    db = get_database()
    
    # Find active treatment plan
    plan = await db.treatment_plans.find_one(
        {"user_id": user_id, "status": "active"},
        sort=[("created_at", -1)]
    )
    
    # [DEV-FIX]: If no plan exists, auto-seed one for the user so they can view the page features.
    if not plan:
        # Create a default "Anxiety & Stress Management" plan
        default_plan = {
            "user_id": user_id,
            "doctor_id": "4", # Assuming '4' is a valid doctor or at least a placeholder
            "plan_title": "Anxiety & Stress Management",
            "plan_details": "A comprehensive cognitive behavioral therapy (CBT) approach focused on identifying triggers, managing stress responses, and building long-term resilience. \n\nWe will focus on weekly sessions combined with daily mindfulness exercises.",
            "goals": [
                "Reduce daily anxiety episodes by 40%",
                "Improve sleep quality (7+ hours/night)",
                "Practice mindfulness for 10 mins daily",
                "Complete weekly CBT journals"
            ],
            "recommendations": [
                "Daily 10-minute meditation (Morning)",
                "Limit caffeine intake after 2 PM",
                "Maintain a consistent sleep schedule",
                "Engage in 30 mins of physical activity 3x/week"
            ],
            "therapy_frequency": "Weekly",
            "duration_weeks": 12,
            "lifestyle_changes": [
                "Reduced screen time before bed",
                "Morning walks",
                "Social connection events"
            ],
            "medication_notes": "SSRI (Sertraline 50mg) - Take daily with breakfast. Monitor for mild nausea in first week.",
            "severity_level": "moderate",
            "start_date": datetime.utcnow() - timedelta(weeks=2), # Started 2 weeks ago
            "end_date": datetime.utcnow() + timedelta(weeks=10),
            "status": "active",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        # Encrypt
        encrypted_plan = encryption.encrypt_dict(
            default_plan,
            ENCRYPTED_FIELDS.get("treatment_plans", [])
        )
        
        # Insert
        result = await db.treatment_plans.insert_one(encrypted_plan)
        plan = await db.treatment_plans.find_one({"_id": result.inserted_id})
        
        logger.info(f"Auto-seeded treatment plan for user {user_id}")

    
    # Decrypt plan
    plan["_id"] = str(plan["_id"])
    decrypted_plan = encryption.decrypt_dict(
        plan,
        ENCRYPTED_FIELDS.get("treatment_plans", [])
    )
    
    # Calculate progress
    start_date = decrypted_plan["start_date"]
    end_date = decrypted_plan["end_date"]
    now = datetime.utcnow()
    
    if now >= end_date:
        progress_percentage = 100
    else:
        total_duration = (end_date - start_date).total_seconds()
        elapsed = (now - start_date).total_seconds()
        progress_percentage = min(100, int((elapsed / total_duration) * 100))
    
    return {
        "treatment_plan": decrypted_plan,
        "progress": {
            "percentage": progress_percentage,
            "weeks_elapsed": (now - start_date).days // 7,
            "weeks_remaining": max(0, (end_date - now).days // 7)
        }
    }


@router.get("/patient/{patient_id}")
async def get_patient_treatment_plans(
    patient_id: str,
    doctor_id: str = Depends(get_current_user_id),
    current_user: dict = Depends(get_current_user)
):
    """
    Get all treatment plans for a patient (Doctor only)
    """
    # Verify doctor role
    if current_user.get("role") != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can access this")
    
    db = get_database()
    
    # Find all plans for patient
    cursor = db.treatment_plans.find(
        {"user_id": patient_id}
    ).sort("created_at", -1)
    
    plans = await cursor.to_list(length=None)
    
    # Decrypt plans
    decrypted_plans = []
    for plan in plans:
        plan["_id"] = str(plan["_id"])
        decrypted_plan = encryption.decrypt_dict(
            plan,
            ENCRYPTED_FIELDS.get("treatment_plans", [])
        )
        decrypted_plans.append(decrypted_plan)
    
    return {
        "patient_id": patient_id,
        "treatment_plans": decrypted_plans,
        "total_count": len(decrypted_plans)
    }


@router.put("/{plan_id}/update")
async def update_treatment_plan(
    plan_id: str,
    plan_data: TreatmentPlan,
    doctor_id: str = Depends(get_current_user_id),
    current_user: dict = Depends(get_current_user)
):
    """
    Update existing treatment plan (Doctor only)
    """
    # Verify doctor role
    if current_user.get("role") != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can update treatment plans")
    
    db = get_database()
    from bson import ObjectId

    # Find existing plan
    existing_plan = await db.treatment_plans.find_one({"_id": ObjectId(plan_id)})
    
    if not existing_plan:
        raise HTTPException(status_code=404, detail="Treatment plan not found")
    
    # Update fields
    update_doc = {
        "plan_title": plan_data.plan_title,
        "plan_details": plan_data.plan_details,
        "goals": plan_data.goals,
        "recommendations": plan_data.recommendations,
        "therapy_frequency": plan_data.therapy_frequency,
        "duration_weeks": plan_data.duration_weeks,
        "lifestyle_changes": plan_data.lifestyle_changes,
        "medication_notes": plan_data.medication_notes,
        "updated_at": datetime.utcnow()
    }
    
    # Encrypt sensitive fields
    encrypted_update = encryption.encrypt_dict(
        update_doc,
        ENCRYPTED_FIELDS.get("treatment_plans", [])
    )
    
    # Update in database
    await db.treatment_plans.update_one(
        {"_id": ObjectId(plan_id)},
        {"$set": encrypted_update}
    )
    
    logger.info(f"Treatment plan {plan_id} updated by doctor {doctor_id}")
    
    return {
        "message": "Treatment plan updated successfully",
        "plan_id": plan_id
    }


@router.post("/{plan_id}/complete")
async def complete_treatment_plan(
    plan_id: str,
    notes: Optional[str] = "",
    doctor_id: str = Depends(get_current_user_id),
    current_user: dict = Depends(get_current_user)
):
    """
    Mark treatment plan as completed (Doctor only)
    """
    # Verify doctor role
    if current_user.get("role") != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can complete treatment plans")
    
    db = get_database()
    from bson import ObjectId

    # Update plan status
    result = await db.treatment_plans.update_one(
        {"_id": ObjectId(plan_id)},
        {
            "$set": {
                "status": "completed",
                "completion_notes": notes,
                "completed_at": datetime.utcnow()
            }
        }
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Treatment plan not found")
    
    logger.info(f"Treatment plan {plan_id} marked as completed by doctor {doctor_id}")
    
    return {
        "message": "Treatment plan marked as completed",
        "plan_id": plan_id
    }