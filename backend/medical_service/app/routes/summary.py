from fastapi import APIRouter, Depends

from app.core.security import get_current_user
from app.repositories.severity_repository import SeverityRepository
from app.repositories.mood_repository import MoodRepository
from app.repositories.symptom_repository import SymptomRepository

router = APIRouter(prefix="/medical/summary", tags=["Medical Summary"])


@router.get("")
def get_medical_summary(
    user=Depends(get_current_user),
):
    user_id = user["user_id"]

    latest_severity = SeverityRepository.get_latest(user_id)
    recent_moods = MoodRepository.list_recent(user_id)
    recent_symptoms = SymptomRepository.list_recent(user_id)

    return {
        "latest_severity": latest_severity,
        "recent_moods": recent_moods,
        "recent_symptoms": recent_symptoms,
    }
