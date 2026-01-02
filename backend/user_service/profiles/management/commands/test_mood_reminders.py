"""
Management command to test the mood reminder functionality
"""
from django.core.management.base import BaseCommand
from profiles.tasks.mood_reminders import send_daily_mood_reminders


class Command(BaseCommand):
    help = 'Test the daily mood reminder functionality'

    def handle(self, *args, **options):
        self.stdout.write(
            self.style.SUCCESS('Starting mood reminder test...')
        )
        
        # Call the task directly to test
        result = send_daily_mood_reminders.delay()
        
        self.stdout.write(
            self.style.SUCCESS(f'Scheduled mood reminder task. Task ID: {result.id}')
        )
        
        self.stdout.write(
            self.style.SUCCESS('Check Celery logs for execution details.')
        )