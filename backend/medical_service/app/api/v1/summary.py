from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.core.security import get_current_user
from app.repositories.mood_repository import MoodRepository
from app.repositories.severity_repository import SeverityRepository
from app.services.risk_service import RiskService


router = APIRouter(prefix="/medical", tags=["Medical Summary"])


class SeveritySummary(BaseModel):
    score: int
    level: str
    recorded_at: datetime


class MoodSummary(BaseModel):
    mood: str
    recorded_at: datetime


class RiskSummary(BaseModel):
    level: str
    reason: str


class MedicalSummaryResponse(BaseModel):
    latest_severity: SeveritySummary
    last_moods: List[MoodSummary]
    risk: RiskSummary


@router.get(
    "/summary",
    response_model=MedicalSummaryResponse,
    responses={
        401: {"description": "Unauthorized"},
        404: {"description": "No medical summary available"},
        422: {"description": "Validation error"},
    },
)
def get_medical_summary(
    current_user=Depends(get_current_user),
):
    user_id = current_user["user_id"]

    latest_severity = SeverityRepository.get_latest(user_id)
    if not latest_severity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No medical summary available",
        )

    recent_moods = MoodRepository.list_recent(user_id, limit=7)

    severity_score = latest_severity.get("score")
    severity_level = latest_severity.get("level")

    recent_mood_values = [m["mood"] for m in recent_moods]

    # Notes are used for keyword-based risk detection; fall back to empty list.
    recent_notes: List[str] = []
    notes_value = latest_severity.get("notes")
    if notes_value:
        recent_notes.append(notes_value)

    risk_result = RiskService.assess(
        user_id=user_id,
        severity_level=severity_level,
        severity_score=severity_score,
        recent_moods=recent_mood_values,
        recent_notes=recent_notes,
    )

    return MedicalSummaryResponse(
        latest_severity=SeveritySummary(
            score=severity_score,
            level=severity_level,
            recorded_at=latest_severity["created_at"],
        ),
        last_moods=[
            MoodSummary(
                mood=m["mood"],
                recorded_at=m["created_at"],
            )
            for m in recent_moods
        ],
        risk=RiskSummary(
            level=risk_result["risk_level"],
            reason=risk_result["reason"],
        ),
    )


