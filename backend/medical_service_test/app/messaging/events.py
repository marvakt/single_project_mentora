from typing import Optional, TypedDict


class HighRiskEvent(TypedDict):
    user_id: int
    score: Optional[int]
    level: str
    reason: str
    timestamp: str
