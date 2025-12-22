




# """
# Django settings for appointment_service project.
# Reviewer-safe, Docker-ready, PostgreSQL-based.
# """

# from pathlib import Path
# import os

# # --------------------------------------------------
# # BASE
# # --------------------------------------------------

# BASE_DIR = Path(__file__).resolve().parent.parent

# # --------------------------------------------------
# # SECURITY
# # --------------------------------------------------

# SECRET_KEY = os.getenv(
#     "DJANGO_SECRET_KEY",
#     "unsafe-dev-secret-key"
# )

# DEBUG = os.getenv("DJANGO_DEBUG", "True") == "True"

# ALLOWED_HOSTS = os.getenv(
#     "DJANGO_ALLOWED_HOSTS",
#     "localhost,127.0.0.1"
# ).split(",")

# # --------------------------------------------------
# # APPLICATIONS
# # --------------------------------------------------

# INSTALLED_APPS = [
#     # Django
#     'django.contrib.admin',
#     'django.contrib.auth',
#     'django.contrib.contenttypes',
#     'django.contrib.sessions',
#     'django.contrib.messages',
#     'django.contrib.staticfiles',

#     # Third-party
#     'rest_framework',
#     'corsheaders',

#     # Local apps
#     'appointments',
# ]
# # --------------------------------------------------
# # MIDDLEWARE
# # --------------------------------------------------

# MIDDLEWARE = [
#     'django.middleware.security.SecurityMiddleware',
#     'django.contrib.sessions.middleware.SessionMiddleware',
#     'django.middleware.common.CommonMiddleware',
#     'django.middleware.csrf.CsrfViewMiddleware',
#     'django.contrib.auth.middleware.AuthenticationMiddleware',
#     'django.contrib.messages.middleware.MessageMiddleware',
#     'django.middleware.clickjacking.XFrameOptionsMiddleware',
# ]

# # --------------------------------------------------
# # URLS / WSGI
# # --------------------------------------------------

# ROOT_URLCONF = 'appointment_service.urls'

# WSGI_APPLICATION = 'appointment_service.wsgi.application'

# # --------------------------------------------------
# # TEMPLATES (KEEP DEFAULT)
# # --------------------------------------------------

# TEMPLATES = [
#     {
#         'BACKEND': 'django.template.backends.django.DjangoTemplates',
#         'DIRS': [],
#         'APP_DIRS': True,
#         'OPTIONS': {
#             'context_processors': [
#                 'django.template.context_processors.debug',
#                 'django.template.context_processors.request',
#                 'django.contrib.auth.context_processors.auth',
#                 'django.contrib.messages.context_processors.messages',
#             ],
#         },
#     },
# ]

# # --------------------------------------------------
# # DATABASE (POSTGRESQL – NOT SQLITE)
# # --------------------------------------------------

# # DATABASES = {
# #     'default': {
# #         'ENGINE': 'django.db.backends.postgresql',
# #         'NAME': os.getenv('POSTGRES_DB', 'appointment_db'),
# #         'USER': os.getenv('POSTGRES_USER', 'postgres'),
# #         'PASSWORD': os.getenv('POSTGRES_PASSWORD', 'postgres'),
# #         'HOST': os.getenv('POSTGRES_HOST', 'localhost'),
# #         'PORT': os.getenv('POSTGRES_PORT', '5432'),
# #     }
# # }


# DATABASES = {
#     "default": {
#         "ENGINE": "django.db.backends.postgresql",
#         "NAME": os.environ["POSTGRES_DB"],
#         "USER": os.environ["POSTGRES_USER"],
#         "PASSWORD": os.environ["POSTGRES_PASSWORD"],
#         "HOST": os.environ["POSTGRES_HOST"],
#         "PORT": os.environ.get("POSTGRES_PORT", "5432"),
#     }
# }



# # --------------------------------------------------
# # PASSWORD VALIDATION
# # --------------------------------------------------

# AUTH_PASSWORD_VALIDATORS = [
#     {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
#     {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
#     {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
#     {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
# ]

# # --------------------------------------------------
# # INTERNATIONALIZATION
# # --------------------------------------------------

# LANGUAGE_CODE = 'en-us'

# TIME_ZONE = 'UTC'

# USE_I18N = True
# USE_TZ = True

# # --------------------------------------------------
# # STATIC FILES
# # --------------------------------------------------

# STATIC_URL = '/static/'

# # --------------------------------------------------
# # DEFAULT PRIMARY KEY
# # --------------------------------------------------

# DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# # --------------------------------------------------
# # DJANGO REST FRAMEWORK (MINIMAL)
# # --------------------------------------------------

# REST_FRAMEWORK = {
#     'DEFAULT_RENDERER_CLASSES': (
#         'rest_framework.renderers.JSONRenderer',
#     ),
# }

# # --------------------------------------------------
# # LOGGING (REVIEWER EXPECTS THIS)
# # --------------------------------------------------

# LOGGING = {
#     'version': 1,
#     'disable_existing_loggers': False,
#     'handlers': {
#         'console': {
#             'class': 'logging.StreamHandler',
#         },
#     },
#     'root': {
#         'handlers': ['console'],
#         'level': 'INFO',
#     },
# }

# # --------------------------------------------------
# # SERVICE-TO-SERVICE CONFIG
# # --------------------------------------------------

# USER_SERVICE_BASE_URL = os.getenv(
#     "USER_SERVICE_BASE_URL",
#     "http://user_service:8000"
# )

# AUTH_SERVICE_BASE_URL = os.getenv(
#     "AUTH_SERVICE_BASE_URL",
#     "http://auth_service:8000"
# )

# # --------------------------------------------------
# # RAZORPAY CONFIG
# # --------------------------------------------------
# # RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "")
# # RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "")
# # Test credentials (replace with production keys via env vars in production)
# # settings.py (CORRECT)
# RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID")
# RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET")

# if not RAZORPAY_KEY_ID:
#     print("⚠️ Razorpay disabled (no key id)")


# # --------------------------------------------------
# # CELERY / RABBITMQ CONFIG
# # --------------------------------------------------

# CELERY_BROKER_URL = os.getenv("RABBITMQ_URL", "amqp://guest:guest@localhost:5672//")
# CELERY_RESULT_BACKEND = os.getenv("REDIS_URL", "redis://localhost:6379/0")
# CELERY_ACCEPT_CONTENT = ["json"]
# CELERY_TASK_SERIALIZER = "json"
# CELERY_RESULT_SERIALIZER = "json"
# CELERY_TIMEZONE = "UTC"

# # --------------------------------------------------
# # CORS CONFIGURATION
# # --------------------------------------------------

# CORS_ALLOWED_ORIGINS = [
#     "http://localhost:5173",
#     "http://localhost:5174",
#     "http://localhost:3000",
# ]

# CORS_ALLOW_CREDENTIALS = True

# CORS_ALLOW_METHODS = [
#     "DELETE",
#     "GET",
#     "OPTIONS",
#     "PATCH",
#     "POST",
#     "PUT",
# ]

# CORS_ALLOW_HEADERS = [
#     "accept",
#     "authorization",
#     "content-type",
#     "user-agent",
#     "x-csrftoken",
#     "x-requested-with",
# ]




"""
appointment_service/settings.py - UPDATED WITH MEDICAL SERVICE INTEGRATION

Django settings for appointment_service with medical service integration.
"""

from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY
SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "unsafe-dev-secret-key")
DEBUG = os.getenv("DJANGO_DEBUG", "True") == "True"
ALLOWED_HOSTS = os.getenv("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")

# APPLICATIONS
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'appointments',
]

# MIDDLEWARE
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',  # CORS before CommonMiddleware
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'appointment_service.urls'
WSGI_APPLICATION = 'appointment_service.wsgi.application'

# TEMPLATES
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

# DATABASE (POSTGRESQL)
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.environ.get("POSTGRES_DB", "appointment_db"),
        "USER": os.environ.get("POSTGRES_USER", "appointment_user"),
        "PASSWORD": os.environ.get("POSTGRES_PASSWORD", "appointment_pass"),
        "HOST": os.environ.get("POSTGRES_HOST", "localhost"),
        "PORT": os.environ.get("POSTGRES_PORT", "5432"),
    }
}

# PASSWORD VALIDATION
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# INTERNATIONALIZATION
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# STATIC FILES
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# DEFAULT PRIMARY KEY
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# DJANGO REST FRAMEWORK
REST_FRAMEWORK = {
    'DEFAULT_RENDERER_CLASSES': (
        'rest_framework.renderers.JSONRenderer',
    ),
    'DEFAULT_PARSER_CLASSES': (
        'rest_framework.parsers.JSONParser',
    ),
    'EXCEPTION_HANDLER': 'rest_framework.views.exception_handler',
}

# LOGGING
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': os.getenv('DJANGO_LOG_LEVEL', 'INFO'),
            'propagate': False,
        },
        'appointments': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}

# SERVICE-TO-SERVICE CONFIGURATION
USER_SERVICE_BASE_URL = os.getenv(
    "USER_SERVICE_BASE_URL",
    "http://user_service:8001/api"
)

AUTH_SERVICE_BASE_URL = os.getenv(
    "AUTH_SERVICE_BASE_URL",
    "http://auth_service:8000/api"
)

MEDICAL_SERVICE_BASE_URL = os.getenv(
    "MEDICAL_SERVICE_BASE_URL",
    "http://medical_service:8003/api/v1"
)

# RAZORPAY CONFIGURATION
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET")

if not RAZORPAY_KEY_ID:
    print("⚠️ Razorpay disabled (no key id)")

# CELERY CONFIGURATION
CELERY_BROKER_URL = os.getenv("RABBITMQ_URL", "amqp://guest:guest@rabbitmq:5672//")
CELERY_RESULT_BACKEND = os.getenv("REDIS_URL", "redis://redis:6379/0")
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_TIMEZONE = "UTC"
CELERY_TASK_TRACK_STARTED = True
CELERY_TASK_TIME_LIMIT = 30 * 60  # 30 minutes

# CORS CONFIGURATION
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
]

CORS_ALLOW_CREDENTIALS = True

CORS_ALLOW_METHODS = [
    "DELETE",
    "GET",
    "OPTIONS",
    "PATCH",
    "POST",
    "PUT",
]

CORS_ALLOW_HEADERS = [
    "accept",
    "authorization",
    "content-type",
    "user-agent",
    "x-csrftoken",
    "x-requested-with",
]

# VIDEO CALL CONFIGURATION
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_API_KEY = os.getenv("TWILIO_API_KEY")
TWILIO_API_SECRET = os.getenv("TWILIO_API_SECRET")

AGORA_APP_ID = os.getenv("AGORA_APP_ID")
AGORA_APP_CERTIFICATE = os.getenv("AGORA_APP_CERTIFICATE")

# APPOINTMENT SETTINGS
APPOINTMENT_REMINDER_HOURS = int(os.getenv("APPOINTMENT_REMINDER_HOURS", "24"))
APPOINTMENT_FOLLOW_UP_DAYS = int(os.getenv("APPOINTMENT_FOLLOW_UP_DAYS", "7"))
MAX_APPOINTMENTS_PER_DAY = int(os.getenv("MAX_APPOINTMENTS_PER_DAY", "10"))

# CACHE CONFIGURATION (Optional, for performance)
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': os.getenv("REDIS_URL", "redis://redis:6379/1"),
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        },
        'KEY_PREFIX': 'appointment_service',
        'TIMEOUT': 300,  # 5 minutes default
    }
}