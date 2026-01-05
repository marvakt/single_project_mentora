import json
import logging
import os

import django
import pika

# 🔥 Django setup (required for standalone process)
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "user_service_project.settings")
django.setup()

logger = logging.getLogger(__name__)

RABBITMQ_URL = os.getenv(
    "RABBITMQ_URL",
    "amqp://guest:guest@mentora_rabbitmq:5672/"
)

QUEUE_NAME = "high_risk_alerts"


def handle_message(channel, method, properties, body):
    """
    Callback executed when a high-risk alert is received
    """
    try:
        message = json.loads(body)

        user_id = message.get("user_id")
        score = message.get("score")
        level = message.get("level")

        logger.critical(
            f"🚨 HIGH RISK ALERT RECEIVED | user={user_id} score={score} level={level}"
        )

        # 🔜 Next phases (not now):
        # - send admin email
        # - notify assigned doctor
        # - emergency escalation

        channel.basic_ack(delivery_tag=method.delivery_tag)

    except Exception as exc:
        logger.error(f"Failed to process high-risk alert: {exc}")
        # Requeue message
        channel.basic_nack(delivery_tag=method.delivery_tag, requeue=True)


def start_consumer():
    params = pika.URLParameters(RABBITMQ_URL)
    connection = pika.BlockingConnection(params)
    channel = connection.channel()

    channel.queue_declare(queue=QUEUE_NAME, durable=True)

    channel.basic_qos(prefetch_count=1)
    channel.basic_consume(queue=QUEUE_NAME, on_message_callback=handle_message)

    logger.info("🔥 High-risk alert consumer started. Waiting for messages...")

    channel.start_consuming()


if __name__ == "__main__":
    start_consumer()
