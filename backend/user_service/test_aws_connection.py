
import boto3
import os
import django
from django.conf import settings

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'user_service_project.settings')
django.setup()

print('----------------------------------------')
print('AWS CONFIG CHECK')
print('----------------------------------------')
print(f'AWS_ACCESS_KEY_ID Configured: {bool(settings.AWS_ACCESS_KEY_ID)}')
if settings.AWS_ACCESS_KEY_ID:
    print(f'Key ID Length: {len(settings.AWS_ACCESS_KEY_ID)}')
print(f'AWS_REGION: {settings.AWS_REGION}')
print(f'Target Bucket: {getattr(settings, "MOOD_REPORTS_S3_BUCKET", "Not Set")}')

print('\n----------------------------------------')
print('CONNECTION TEST')
print('----------------------------------------')
try:
    s3 = boto3.client(
        's3',
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_REGION
    )
    print('Attempting to list buckets...')
    response = s3.list_buckets()
    print('✅ SUCCESS: List buckets successful!')
    
    print('Buckets found:')
    for bucket in response['Buckets']:
        print(f" - {bucket['Name']}")
        
except Exception as e:
    print(f'❌ FAILED: {str(e)}')
