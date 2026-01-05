"""
Appointment service package.

Includes both producer and consumer modules for event handling.
"""
from . import consumer, producer

# This ensures that Celery can discover tasks in both modules
__all__ = ['producer', 'consumer']
