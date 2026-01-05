import json
import logging

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(
    bind=True,
    autoretry_for=(Exception,),
    retry_kwargs={"max_retries": 5, "countdown": 10},
    retry_backoff=True,
    name="profiles.handle_high_risk_alert",
)
def handle_high_risk_alert(self, message: str):
    data = json.loads(message)

    logger.critical(
        f"HIGH RISK ALERT | user={data.get('user_id')} "
        f"score={data.get('score')} level={data.get('level')}"
    )

    return True
