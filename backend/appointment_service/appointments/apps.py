"""
appointments/apps.py - APP CONFIGURATION

Proper Django app configuration with signal registration.
"""
from django.apps import AppConfig


class AppointmentsConfig(AppConfig):
    """
    Configuration for appointments app.
    Handles signal registration on app ready.
    """
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'appointments'
    verbose_name = 'Appointment Service'

    def ready(self):
        """
        Runs when Django starts.
        Imports and registers signals.
        """
        # Import signals to register them
        from . import signals

        # Explicitly register signals (if needed)
        signals.register_signals()