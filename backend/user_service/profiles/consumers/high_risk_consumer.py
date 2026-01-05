import logging

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(
    bind=True,
    name="profiles.handle_high_risk_alert",
    autoretry_for=(Exception,),
    retry_backoff=5,
    retry_kwargs={"max_retries": 5},
)
def handle_high_risk_alert(
    self,
    *,
    user_id: int,
    risk_level: str,
    reason: str,
    timestamp: str,
):
    """
    Handles HIGH-RISK alerts coming from medical_service.
    This task is triggered via Celery (RabbitMQ broker).
    """

    logger.critical(
        "🚨 HIGH RISK ALERT | user_id=%s | level=%s | reason=%s | at=%s",
        user_id,
        risk_level,
        reason,
        timestamp,
    )

    # =====================================================
    # PHASE 1 — AUDIT LOG (MANDATORY)
    # =====================================================
    # TODO:
    # HighRiskAuditLog.objects.create(
    #     user_id=user_id,
    #     level=risk_level,
    #     reason=reason,
    #     timestamp=timestamp,
    # )

    # =====================================================
    # PHASE 2 — ADMIN NOTIFICATION
    # =====================================================
    # TODO:
    # send_admin_email(user_id, reason)

    # =====================================================
    # PHASE 3 — DOCTOR NOTIFICATION
    # =====================================================
    # TODO:
    # notify_assigned_doctor(user_id, reason)

    return {"status": "processed"}
