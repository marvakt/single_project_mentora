from typing import Dict, List, Optional
from datetime import datetime

from app.ai.severity_levels import SeverityLevel
from app.messaging.celery_client import celery_app
from app.messaging.events import HighRiskEvent


# Minimal keyword list (V1)
SUICIDE_KEYWORDS = {
    "suicide",
    "kill myself",
    "end my life",
    "self harm",
    "no reason to live",
    "hopeless",
}


class RiskService:
    @staticmethod
    def assess(
        *,
        user_id: int,
        severity_level: str,
        severity_score: Optional[int] = None,
        recent_moods: List[str],
        recent_notes: List[str],
    ) -> Dict:
        """
        Assess user risk level and publish HIGH-RISK event if detected.

        Returns:
            {
                "risk_level": "normal" | "high",
                "reason": str
            }
        """

        severity = SeverityLevel(severity_level)

        # --------------------------------------------------
        # RULE 1 — CRITICAL severity overrides everything
        # --------------------------------------------------
        if severity == SeverityLevel.CRITICAL:
            result = {
                "risk_level": "high",
                "reason": "Critical severity score detected",
            }
            RiskService._publish_high_risk(
                user_id=user_id,
                score=severity_score,
                level=severity_level,
                reason=result["reason"],
            )
            return result

        # --------------------------------------------------
        # RULE 2 — HIGH severity + persistent negative mood
        # --------------------------------------------------
        if severity == SeverityLevel.HIGH:
            negative_count = sum(
                1 for mood in recent_moods
                if mood.lower() in {"anxious", "depressed", "hopeless"}
            )

            if negative_count >= 3:
                result = {
                    "risk_level": "high",
                    "reason": "High severity with persistent negative mood",
                }
                RiskService._publish_high_risk(
                    user_id=user_id,
                    score=severity_score,
                    level=severity_level,
                    reason=result["reason"],
                )
                return result

        # --------------------------------------------------
        # RULE 3 — Keyword-based suicide signals
        # --------------------------------------------------
        for note in recent_notes:
            text = note.lower()
            if any(keyword in text for keyword in SUICIDE_KEYWORDS):
                result = {
                    "risk_level": "high",
                    "reason": "Suicidal ideation keywords detected",
                }
                RiskService._publish_high_risk(
                    user_id=user_id,
                    score=severity_score,
                    level=severity_level,
                    reason=result["reason"],
                )
                return result

        # --------------------------------------------------
        # DEFAULT — NORMAL RISK
        # --------------------------------------------------
        return {
            "risk_level": "normal",
            "reason": "No high-risk signals detected",
        }

    # ======================================================
    # INTERNAL: EVENT PUBLISHER (DO NOT CALL DIRECTLY)
    # ======================================================
    @staticmethod
    def _publish_high_risk(
        *,
        user_id: int,
        score: Optional[int],
        level: str,
        reason: str,
    ) -> None:
        """
        Emit high-risk alert to user_service via RabbitMQ.
        """

        event: HighRiskEvent = {
            "user_id": user_id,
            "score": score,
            "level": level,
            "reason": reason,
            "timestamp": datetime.utcnow().isoformat(),
        }

        # Celery routes this task name to the underlying RabbitMQ queue.
        celery_app.send_task(
            "high_risk_alerts",
            kwargs=event,
        )
