from fastapi import APIRouter, Depends, status
from pydantic import BaseModel

from app.core.security import get_current_user
from app.repositories.severity_repository import SeverityRepository

router = APIRouter(prefix="/medical/severity", tags=["Severity"])


class SeverityCreateRequest(BaseModel):
    score: int
    level: str
    notes: str | None = None


@router.post("", status_code=status.HTTP_201_CREATED)
def create_severity(
    data: SeverityCreateRequest,
    user=Depends(get_current_user),
):
    return SeverityRepository.create(
        user_id=user["user_id"],
        score=data.score,
        level=data.level,
        notes=data.notes,
    )


@router.get("/latest")
def get_latest_severity(
    user=Depends(get_current_user),
):
    return SeverityRepository.get_latest(user["user_id"])
