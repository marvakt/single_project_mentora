"""
Test script to verify event publishing and consumption.

This script tests the event-driven communication between services.
"""
import os
import sys
import django

# Add the user_service directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'user_service_project.settings')
django.setup()

# Import the producer
from profiles.producer import publish_doctor_approved, publish_doctor_rejected

def test_doctor_events():
    """Test publishing doctor approval and rejection events."""
    print("Testing doctor event publishing...")
    
    # Test doctor approved event
    print("Publishing doctor approved event...")
    result = publish_doctor_approved.delay(
        user_id=123,
        email="test@example.com",
        name="Dr. Test",
        specialization="Cardiology"
    )
    print(f"Doctor approved event published: {result.get()}")
    
    # Test doctor rejected event
    print("Publishing doctor rejected event...")
    result = publish_doctor_rejected.delay(
        user_id=456,
        email="rejected@example.com",
        name="Dr. Rejected",
        reason="Incomplete documentation"
    )
    print(f"Doctor rejected event published: {result.get()}")
    
    print("Event publishing test completed!")

if __name__ == "__main__":
    test_doctor_events()