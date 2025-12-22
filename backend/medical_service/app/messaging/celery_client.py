"""
app/messaging/celery_client.py - Celery Client for Async Tasks
Sends high-risk alerts and insights to user service
"""

import pika
import json
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)


def get_rabbitmq_connection():
    """Get RabbitMQ connection"""
    try:
        connection = pika.BlockingConnection(
            pika.URLParameters(settings.RABBITMQ_URL)
        )
        return connection
    except Exception as e:
        logger.error(f"Failed to connect to RabbitMQ: {e}")
        return None


def send_high_risk_alert(user_id: str, severity_data: dict):
    """
    Send high-risk alert to user service for immediate action
    
    Args:
        user_id: User ID who needs immediate attention
        severity_data: Severity assessment data
    """
    try:
        connection = get_rabbitmq_connection()
        if not connection:
            logger.error("Cannot send high-risk alert: No RabbitMQ connection")
            return
        
        channel = connection.channel()
        
        # Declare exchange and queue
        channel.exchange_declare(exchange='medical_events', exchange_type='topic', durable=True)
        channel.queue_declare(queue='high_risk_alerts', durable=True)
        channel.queue_bind(exchange='medical_events', queue='high_risk_alerts', routing_key='alert.high_risk')
        
        # Prepare message
        message = {
            "event_type": "high_risk_detected",
            "user_id": user_id,
            "severity_level": severity_data.get("severity_level"),
            "raw_score": severity_data.get("raw_score"),
            "specialist_type": severity_data.get("specialist_type"),
            "timestamp": severity_data.get("assessed_at"),
            "alert_priority": "immediate"
        }
        
        # Publish message
        channel.basic_publish(
            exchange='medical_events',
            routing_key='alert.high_risk',
            body=json.dumps(message),
            properties=pika.BasicProperties(
                delivery_mode=2,  # Make message persistent
                content_type='application/json'
            )
        )
        
        logger.info(f"✅ High-risk alert sent for user {user_id}")
        
        connection.close()
        
    except Exception as e:
        logger.error(f"❌ Failed to send high-risk alert: {e}")


def send_weekly_insights(user_id: str, insights: dict):
    """
    Send weekly mental health insights to user service
    
    Args:
        user_id: User ID
        insights: Dictionary containing insights and recommendations
    """
    try:
        connection = get_rabbitmq_connection()
        if not connection:
            logger.error("Cannot send insights: No RabbitMQ connection")
            return
        
        channel = connection.channel()
        
        # Declare exchange and queue
        channel.exchange_declare(exchange='medical_events', exchange_type='topic', durable=True)
        channel.queue_declare(queue='weekly_insights', durable=True)
        channel.queue_bind(exchange='medical_events', queue='weekly_insights', routing_key='insights.weekly')
        
        # Prepare message
        message = {
            "event_type": "weekly_insights",
            "user_id": user_id,
            "insights": insights,
            "generated_at": insights.get("generated_at")
        }
        
        # Publish message
        channel.basic_publish(
            exchange='medical_events',
            routing_key='insights.weekly',
            body=json.dumps(message),
            properties=pika.BasicProperties(
                delivery_mode=2,
                content_type='application/json'
            )
        )
        
        logger.info(f"✅ Weekly insights sent for user {user_id}")
        
        connection.close()
        
    except Exception as e:
        logger.error(f"❌ Failed to send weekly insights: {e}")


def send_severity_update(user_id: str, severity_data: dict):
    """
    Send severity update to appointment service for priority booking
    
    Args:
        user_id: User ID
        severity_data: Severity assessment data
    """
    try:
        connection = get_rabbitmq_connection()
        if not connection:
            return
        
        channel = connection.channel()
        
        # Declare exchange and queue
        channel.exchange_declare(exchange='medical_events', exchange_type='topic', durable=True)
        channel.queue_declare(queue='severity_updates', durable=True)
        channel.queue_bind(exchange='medical_events', queue='severity_updates', routing_key='severity.updated')
        
        # Prepare message
        message = {
            "event_type": "severity_updated",
            "user_id": user_id,
            "severity_level": severity_data.get("severity_level"),
            "specialist_type": severity_data.get("specialist_type"),
            "high_risk": severity_data.get("high_risk", False),
            "timestamp": severity_data.get("assessed_at")
        }
        
        # Publish message
        channel.basic_publish(
            exchange='medical_events',
            routing_key='severity.updated',
            body=json.dumps(message),
            properties=pika.BasicProperties(
                delivery_mode=2,
                content_type='application/json'
            )
        )
        
        logger.info(f"✅ Severity update sent for user {user_id}")
        
        connection.close()
        
    except Exception as e:
        logger.error(f"❌ Failed to send severity update: {e}")