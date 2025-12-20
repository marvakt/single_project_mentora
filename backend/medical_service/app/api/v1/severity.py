from fastapi import APIRouter, Depends

from app.core.security import get_current_user
from app.repositories.severity_repository import SeverityRepository

router = APIRouter(prefix="/severity", tags=["Severity"])


@router.get("/latest")
def get_latest_severity(current_user=Depends(get_current_user)):
    """
    Used by appointment_service to prioritize bookings.
    """
    result = SeverityRepository.get_latest(current_user["user_id"])

    if not result:
        return {
            "severity": None,
            "level": None,
            "recorded_at": None,
        }

    return {
        "severity": result["score"],
        "level": result["level"],
        "recorded_at": result["created_at"],
    }
