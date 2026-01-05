"""
app/routes/session_notes.py - Session Notes Management
Doctor's notes from therapy sessions
"""

import logging
from datetime import datetime
from typing import Optional

from app.core.database import get_database
from app.core.encryption import ENCRYPTED_FIELDS, encryption
from app.core.security import get_current_user, get_current_user_id
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

router = APIRouter()


# Request/Response Models
class SessionNote(BaseModel):
    """Session note model"""
    appointment_id: str
    user_id: str = Field(description="Patient user ID")
    notes: str = Field(min_length=10)
    diagnosis: Optional[str] = ""
    recommendations: Optional[str] = ""
    prescription: Optional[str] = ""
    next_session_plan: Optional[str] = ""
    patient_progress: Optional[str] = ""


@router.post("/create")
async def create_session_note(
    note_data: SessionNote,
    doctor_id: str = Depends(get_current_user_id),
    current_user: dict = Depends(get_current_user)
):
    """
    Create session notes after appointment (Doctor only)
    
    Stores encrypted clinical notes, diagnosis, and recommendations
    """
    # Verify doctor role
    if current_user.get("role") != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can create session notes")
    
    db = get_database()
    
    # Check if notes already exist for this appointment
    existing_note = await db.session_notes.find_one({
        "appointment_id": note_data.appointment_id
    })
    
    if existing_note:
        raise HTTPException(
            status_code=400,
            detail="Session notes already exist for this appointment"
        )
    
    # Prepare session note document
    note_doc = {
        "appointment_id": note_data.appointment_id,
        "user_id": note_data.user_id,
        "doctor_id": doctor_id,
        "notes": note_data.notes,
        "diagnosis": note_data.diagnosis,
        "recommendations": note_data.recommendations,
        "prescription": note_data.prescription,
        "next_session_plan": note_data.next_session_plan,
        "patient_progress": note_data.patient_progress,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    # Encrypt sensitive fields
    encrypted_note = encryption.encrypt_dict(
        note_doc,
        ENCRYPTED_FIELDS.get("session_notes", [])
    )
    
    # Store in database
    result = await db.session_notes.insert_one(encrypted_note)

    logger.info(f"Session notes created by doctor {doctor_id} for appointment {note_data.appointment_id}")
    
    return {
        "session_note_id": str(result.inserted_id),
        "message": "Session notes saved successfully",
        "appointment_id": note_data.appointment_id
    }


@router.get("/appointment/{appointment_id}")
async def get_session_note_by_appointment(
    appointment_id: str,
    user_id: str = Depends(get_current_user_id),
    current_user: dict = Depends(get_current_user)
):
    """
    Get session notes for specific appointment
    
    Accessible by patient and doctor involved
    """
    db = get_database()
    
    # Find session note
    note = await db.session_notes.find_one({"appointment_id": appointment_id})
    
    if not note:
        return {
            "session_note": None,
            "message": "No session notes found for this appointment"
        }
    
    # Verify access rights
    user_role = current_user.get("role")
    
    # Generate allowed IDs for user
    allowed_user_ids = [str(user_id)]
    try:
        norm_id = normalize_id(user_id)
        if norm_id != str(user_id):
            allowed_user_ids.append(norm_id)
    except:
        pass

    print(f"DEBUG: Session Note Access - Role: {user_role}, Note UserID: {note['user_id']}, Request UserID: {user_id}, Allowed: {allowed_user_ids}")
    
    if user_role == "user" and str(note["user_id"]) not in allowed_user_ids:
        print(f"DEBUG: Access Denied! {note['user_id']} not in {allowed_user_ids}")
        raise HTTPException(status_code=403, detail=f"Access denied: Note belongs to {note['user_id']}, you are {user_id}")
    elif user_role == "doctor" and str(note["doctor_id"]) != str(user_id):
        # For doctors, we assume ID format is consistent or they might need similar logic, 
        # but usually doctors don't have this mixed ID issue as often. Keeping simple for now.
        raise HTTPException(status_code=403, detail="You can only access notes you created")
    
    # Decrypt note
    note["_id"] = str(note["_id"])
    decrypted_note = encryption.decrypt_dict(
        note,
        ENCRYPTED_FIELDS.get("session_notes", [])
    )
    
    return {
        "session_note": decrypted_note
    }


import uuid

def normalize_id(value) -> str:
    """Convert ID to UUID string if it's an integer usage"""
    try:
        val_str = str(value)
        if val_str.isdigit() and len(val_str) < 32:
             return str(uuid.UUID(int=int(val_str)))
        return val_str
    except:
        return str(value)

@router.get("/my-notes")
async def get_my_session_notes(
    limit: int = 20,
    user_id: str = Depends(get_current_user_id)
):
    """
    Get all session notes for current user (Patient view)
    Handles both Integer IDs (Legacy) and UUIDs
    """
    db = get_database()
    
    # Generate ID variants to search
    search_ids = [user_id]
    try:
        norm_id = normalize_id(user_id)
        if norm_id != user_id:
            search_ids.append(norm_id)
    except:
        pass
        
    print(f"DEBUG: Fetching notes for user {user_id}. Searching variants: {search_ids}")

    # Find all notes for user (matching any ID variant)
    cursor = db.session_notes.find(
        {"user_id": {"$in": search_ids}}
    ).sort("created_at", -1).limit(limit)
    
    notes = await cursor.to_list(length=limit)
    
    # Decrypt notes
    decrypted_notes = []
    for note in notes:
        note["_id"] = str(note["_id"])
        decrypted_note = encryption.decrypt_dict(
            note,
            ENCRYPTED_FIELDS.get("session_notes", [])
        )
        decrypted_notes.append(decrypted_note)
    
    return {
        "session_notes": decrypted_notes,
        "total_count": len(decrypted_notes)
    }


@router.get("/patient/{patient_id}")
async def get_patient_session_notes(
    patient_id: str,
    limit: int = 20,
    doctor_id: str = Depends(get_current_user_id),
    current_user: dict = Depends(get_current_user)
):
    """
    Get all session notes for a patient (Doctor view)
    """
    # Verify doctor role
    if current_user.get("role") != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can access this")
    
    db = get_database()
    
    # Find all notes for patient by this doctor
    cursor = db.session_notes.find({
        "user_id": patient_id,
        "doctor_id": doctor_id
    }).sort("created_at", -1).limit(limit)
    
    notes = await cursor.to_list(length=limit)
    
    # Decrypt notes
    decrypted_notes = []
    for note in notes:
        note["_id"] = str(note["_id"])
        decrypted_note = encryption.decrypt_dict(
            note,
            ENCRYPTED_FIELDS.get("session_notes", [])
        )
        decrypted_notes.append(decrypted_note)
    
    return {
        "patient_id": patient_id,
        "session_notes": decrypted_notes,
        "total_count": len(decrypted_notes)
    }


@router.put("/{note_id}")
async def update_session_note(
    note_id: str,
    note_data: SessionNote,
    doctor_id: str = Depends(get_current_user_id),
    current_user: dict = Depends(get_current_user)
):
    """
    Update existing session note (Doctor only)
    """
    # Verify doctor role
    if current_user.get("role") != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can update session notes")
    
    db = get_database()
    from bson import ObjectId

    # Find existing note
    existing_note = await db.session_notes.find_one({"_id": ObjectId(note_id)})
    
    if not existing_note:
        raise HTTPException(status_code=404, detail="Session note not found")
    
    # Verify doctor owns this note
    if existing_note["doctor_id"] != doctor_id:
        raise HTTPException(status_code=403, detail="You can only update your own notes")
    
    # Update fields
    update_doc = {
        "notes": note_data.notes,
        "diagnosis": note_data.diagnosis,
        "recommendations": note_data.recommendations,
        "prescription": note_data.prescription,
        "next_session_plan": note_data.next_session_plan,
        "patient_progress": note_data.patient_progress,
        "updated_at": datetime.utcnow()
    }
    
    # Encrypt sensitive fields
    encrypted_update = encryption.encrypt_dict(
        update_doc,
        ENCRYPTED_FIELDS.get("session_notes", [])
    )
    
    # Update in database
    await db.session_notes.update_one(
        {"_id": ObjectId(note_id)},
        {"$set": encrypted_update}
    )
    
    logger.info(f"Session note {note_id} updated by doctor {doctor_id}")
    
    return {
        "message": "Session note updated successfully",
        "note_id": note_id
    }