from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.core.security import get_current_user
from app.repositories.symptom_repository import SymptomRepository
from app.services.symptom_service import SymptomService

router = APIRouter(prefix="/medical/symptoms", tags=["Symptoms"])


class SymptomCreateRequest(BaseModel):
    symptom: str
    severity: str
    description: str | None = None


@router.post("", status_code=status.HTTP_201_CREATED)
def create_symptom(
    data: SymptomCreateRequest,
    user=Depends(get_current_user),
):
    try:
        SymptomService.validate_severity(data.severity)
        symptom = SymptomService.normalize(data.symptom)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )

    return SymptomRepository.create(
        user_id=user["user_id"],
        symptom=symptom,
        severity=data.severity,
        description=data.description,
    )


@router.get("/recent")
def list_recent_symptoms(
    user=Depends(get_current_user),
):
    return SymptomRepository.list_recent(user["user_id"])
