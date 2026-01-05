import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

# ==================================================
# CORE
# ==================================================
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret")
DEBUG = True

# Explicitly allowing the service name and port to fix HTTP_HOST validation
ALLOWED_HOSTS = [
    "localhost",
    "127.0.0.1",
    "user-service",
    "user-service:8001",
    "*"
]

# ==================================================
# APPLICATIONS
# ==================================================
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    "rest_framework",
    "corsheaders",
    "drf_yasg",

    "profiles",
]

# ==================================================
# MIDDLEWARE
# ==================================================
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    # Commenting out CommonMiddleware to bypass HTTP_HOST validation issues
    # "django.middleware.common.CommonMiddleware",
    # Commenting out CSRF middleware for internal service calls
    # "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

# ==================================================
# URL / WSGI
# ==================================================
ROOT_URLCONF = "user_service_project.urls"
WSGI_APPLICATION = "user_service_project.wsgi.application"

# ==================================================
# TEMPLATES
# ==================================================
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

# ==================================================
# DATABASE
# ==================================================
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.getenv("DB_NAME"),
        "USER": os.getenv("DB_USER"),
        "PASSWORD": os.getenv("DB_PASSWORD"),
        "HOST": os.getenv("DB_HOST"),
        "PORT": os.getenv("DB_PORT", "5432"),
    }
}

# ==================================================
# DRF
# ==================================================
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        'rest_framework.authentication.SessionAuthentication',  # For admin interface
        'rest_framework.authentication.TokenAuthentication',   # For API tokens
    ],
    'DEFAULT_SCHEMA_CLASS': 'rest_framework.schemas.coreapi.AutoSchema',
    "DEFAULT_PERMISSION_CLASSES": [
        'rest_framework.permissions.IsAuthenticated',  # Default to authenticated
    ],
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
        'rest_framework.renderers.BrowsableAPIRenderer',
    ],
}

# ==================================================
# INTERNATIONALIZATION
# ==================================================
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

# ==================================================
# STATIC
# ==================================================
STATIC_URL = "/static/"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ==================================================
# JWT (MUST MATCH AUTH SERVICE)
# ==================================================
JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = "HS256"

# ==================================================
# INTERNAL SERVICE TOKEN
# ==================================================
INTERNAL_SERVICE_TOKEN = os.getenv("INTERNAL_SERVICE_TOKEN", "dev-internal")

# ==================================================
# CELERY
# ==================================================
CELERY_BROKER_URL = os.getenv(
    "RABBITMQ_URL", "amqp://guest:guest@rabbitmq:5672/"
)
CELERY_RESULT_BACKEND = os.getenv(
    "REDIS_URL", "redis://redis:6379/0"
)

CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_TIMEZONE = "UTC"

# ==================================================
# AWS CONFIGURATION
# ==================================================
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
AWS_SES_REGION = os.getenv("AWS_SES_REGION", "us-east-1")

# SQS Configuration
MOOD_TRACKING_SQS_QUEUE_URL = os.getenv("MOOD_TRACKING_SQS_QUEUE_URL")

# S3 Configuration
MOOD_REPORTS_S3_BUCKET = os.getenv("MOOD_REPORTS_S3_BUCKET", "mentora-mood-reports")

# SNS Configuration
MOOD_NOTIFICATION_TOPIC_ARN = os.getenv("MOOD_NOTIFICATION_TOPIC_ARN")

# SES Configuration
SES_SENDER_EMAIL = os.getenv("SES_SENDER_EMAIL", "noreply@mentora.com")

# ==================================================
# EMAIL
# ==================================================
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = "smtp.gmail.com"
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD")
DEFAULT_FROM_EMAIL = os.getenv("DEFAULT_FROM_EMAIL")

# ==================================================
# CORS / CSRF
# ==================================================
CORS_ALLOW_CREDENTIALS = True

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
]

CSRF_TRUSTED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
]

# ==================================================
# SWAGGER (DRF-YASG) CONFIGURATION FOR JWT
# ==================================================
SWAGGER_SETTINGS = {
    'SECURITY_DEFINITIONS': {
        'Bearer': {
            'type': 'apiKey',
            'name': 'Authorization',
            'in': 'header',
            'description': 'Enter your JWT token with Bearer prefix, e.g., "Bearer your_token_here"',
        },
    },
    'USE_SESSION_AUTH': False,
    'DOC_EXPANSION': 'list',
    'SHOW_REQUEST_HEADERS': True,
    'APIS_SORTER': 'alpha',
    'OPERATIONS_SORTER': 'alpha',
    'SECURITY_REQUIREMENTS': [{'Bearer': []}],
}
