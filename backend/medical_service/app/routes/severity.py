# ==================== app/routes/severity.py ====================
from fastapi import APIRouter, Depends
from app.core.security import get_current_user_id
from app.core.database import get_database

router = APIRouter()

@router.get("/current")
async def get_current_severity(user_id: str = Depends(get_current_user_id)):
    """Get user's current severity level"""
    db = get_database()
    
    latest = await db.severity_logs.find_one(
        {"user_id": user_id},
        sort=[("created_at", -1)]
    )
    
    if not latest:
        return {"severity_level": None, "message": "No assessment found"}
    
    return {
        "severity_level": latest.get("severity_level"),
        "specialist_type": latest.get("specialist_type"),
        "assessed_at": latest.get("created_at")
    }
