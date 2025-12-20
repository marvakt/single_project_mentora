#!/usr/bin/env python
"""
Standalone consumer for doctor approval/rejection events.

This script directly consumes events from RabbitMQ without using Celery,
which avoids the configuration issues we've been experiencing.
"""
import os
import sys
import json
import time
import pika
import logging
import django

# Set up Django (minimal setup without database)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'appointment_service.settings')
# Don't initialize Django for this consumer as it doesn't need database access
# This avoids the need for database environment variables

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def handle_doctor_approved(ch, method, properties, body):
    """Handle doctor approved events."""
    try:
        event_data = json.loads(body)
        logger.info(f"Processing doctor approved event: {event_data}")
        
        # Business logic for handling approved doctors:
        # 1. Update local cache/index of approved doctors for faster lookups
        # 2. Send welcome email to newly approved doctor (optional)
        # 3. Pre-warm any caches that might need doctor information
        
        # For now, just log the event
        logger.info(f"✅ Doctor approved: {event_data.get('name')} ({event_data.get('email')}) - {event_data.get('specialization')}")
        
        # In a real implementation, you might want to:
        # - Update a local cache of approved doctors
        # - Index doctors in Elasticsearch for search
        # - Send notifications to relevant parties
        
        # Acknowledge the message
        ch.basic_ack(delivery_tag=method.delivery_tag)
        
    except Exception as e:
        logger.error(f"Error processing doctor approved event: {e}")
        # Reject and requeue the message
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=True)

def handle_doctor_rejected(ch, method, properties, body):
    """Handle doctor rejected events."""
    try:
        event_data = json.loads(body)
        logger.info(f"Processing doctor rejected event: {event_data}")
        
        # Business logic for handling rejected doctors:
        # 1. Send rejection email to doctor (optional)
        # 2. Remove doctor from any caches or indexes
        # 3. Update metrics/analytics
        # 4. Clean up any temporary records
        
        # For now, just log the event
        logger.info(f"❌ Doctor rejected: {event_data.get('name')} ({event_data.get('email')}) - Reason: {event_data.get('reason')}")
        
        # In a real implementation, you might want to:
        # - Remove doctor from local caches
        # - Update analytics dashboards
        # - Trigger cleanup processes
        
        # Acknowledge the message
        ch.basic_ack(delivery_tag=method.delivery_tag)
        
    except Exception as e:
        logger.error(f"Error processing doctor rejected event: {e}")
        # Reject and requeue the message
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=True)

def main():
    """Main consumer loop."""
    # Get RabbitMQ connection parameters
    rabbitmq_url = os.getenv("RABBITMQ_URL", "amqp://guest:guest@rabbitmq:5672/")
    
    logger.info(f"Connecting to RabbitMQ at {rabbitmq_url}")
    
    # Parse the RabbitMQ URL
    parameters = pika.URLParameters(rabbitmq_url)
    
    # Add retry logic for connection
    max_retries = 10
    retry_delay = 3
    
    for attempt in range(max_retries):
        try:
            # Create connection and channel
            connection = pika.BlockingConnection(parameters)
            channel = connection.channel()
            logger.info("Successfully connected to RabbitMQ")
            break
        except Exception as e:
            logger.warning(f"Failed to connect to RabbitMQ (attempt {attempt + 1}/{max_retries}): {e}")
            if attempt < max_retries - 1:
                logger.info(f"Retrying in {retry_delay} seconds...")
                time.sleep(retry_delay)
            else:
                logger.error("Failed to connect to RabbitMQ after all retries")
                raise
    
    # Declare queues (idempotent)
    channel.queue_declare(queue='doctor_approved', durable=True)
    channel.queue_declare(queue='doctor_rejected', durable=True)
    
    # Set up consumers
    channel.basic_consume(queue='doctor_approved', on_message_callback=handle_doctor_approved)
    channel.basic_consume(queue='doctor_rejected', on_message_callback=handle_doctor_rejected)
    
    logger.info("Waiting for doctor approval/rejection events. To exit press CTRL+C")
    
    try:
        channel.start_consuming()
    except KeyboardInterrupt:
        logger.info("Stopping consumer...")
        channel.stop_consuming()
        connection.close()
        sys.exit(0)

if __name__ == "__main__":
    main()