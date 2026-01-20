import boto3
import os
from django.conf import settings
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'user_service_project.settings')
django.setup()

print('Checking AWS Config:')
print(f'Key ID present: {bool(settings.AWS_ACCESS_KEY_ID)}')
print(f'Region: {settings.AWS_REGION}')
print(f'Bucket: {getattr(settings, 'MOOD_REPORTS_S3_BUCKET', 'Not Set')}')

try:
    s3 = boto3.client(
        's3',
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_REGION
    )
    print('Attempting list buckets...')
    s3.list_buckets()
    print('List buckets successful!')
except Exception as e:
    print(f'Error: {e}')
