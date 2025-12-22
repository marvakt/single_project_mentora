from datetime import datetime
from typing import TypedDict


class SymptomDocument(TypedDict):
    user_id: int
    symptom: str
    severity: str
    description: str | None
    created_at: datetime
