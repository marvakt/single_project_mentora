from fastapi import APIRouter, Depends, status
from pydantic import BaseModel

from app.core.security import get_current_user
from app.repositories.mood_repository import MoodRepository

router = APIRouter(prefix="/medical/mood", tags=["Mood"])


class MoodCreateRequest(BaseModel):
    mood: str
    description: str | None = None


@router.post("", status_code=status.HTTP_201_CREATED)
def create_mood(
    data: MoodCreateRequest,
    user=Depends(get_current_user),
):
    return MoodRepository.create(
        user_id=user["user_id"],
        mood=data.mood,
        description=data.description,
    )


@router.get("/recent")
def list_recent_moods(
    user=Depends(get_current_user),
):
    return MoodRepository.list_recent(user["user_id"])
