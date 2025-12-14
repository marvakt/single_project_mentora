

# import os
# from pathlib import Path
# from dotenv import load_dotenv

# # Load .env
# load_dotenv()

# BASE_DIR = Path(__file__).resolve().parent.parent

# # ===============================
# # SECURITY
# # ===============================
# SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret")
# DEBUG = os.getenv("DEBUG", "True") == "True"

# # 🔥 FIXED: Allow internal Docker network calls
# ALLOWED_HOSTS = [
#     "*",
#     "localhost",
#     "127.0.0.1",
#     "mentora_user_service",  # <--- REQUIRED for Docker internal calls
# ]

# # ===============================
# # INSTALLED APPS
# # ===============================
# INSTALLED_APPS = [
#     "django.contrib.admin",
#     "django.contrib.auth",
#     "django.contrib.contenttypes",
#     "django.contrib.sessions",
#     "django.contrib.messages",
#     "django.contrib.staticfiles",

#     # Third-party
#     "rest_framework",
#     "corsheaders",

#     # Local apps
#     "profiles",
# ]

# # ===============================
# # MIDDLEWARE
# # ===============================
# MIDDLEWARE = [
#     "django.middleware.security.SecurityMiddleware",
#     "corsheaders.middleware.CorsMiddleware",
#     "django.contrib.sessions.middleware.SessionMiddleware",
#     "django.middleware.common.CommonMiddleware",
#     "django.middleware.csrf.CsrfViewMiddleware",
#     "django.contrib.auth.middleware.AuthenticationMiddleware",
#     "django.contrib.messages.middleware.MessageMiddleware",
#     "django.middleware.clickjacking.XFrameOptionsMiddleware",
# ]

# ROOT_URLCONF = "user_service_project.urls"

# # ===============================
# # TEMPLATES
# # ===============================
# TEMPLATES = [
#     {
#         "BACKEND": "django.template.backends.django.DjangoTemplates",
#         "DIRS": [],
#         "APP_DIRS": True,
#         "OPTIONS": {
#             "context_processors": [
#                 "django.template.context_processors.debug",
#                 "django.template.context_processors.request",
#                 "django.contrib.auth.context_processors.auth",
#                 "django.contrib.messages.context_processors.messages",
#             ],
#         },
#     },
# ]

# WSGI_APPLICATION = "user_service_project.wsgi.application"

# # ===============================
# # DATABASE — PostgreSQL
# # ===============================
# DATABASES = {
#     "default": {
#         "ENGINE": "django.db.backends.postgresql",
#         "NAME": os.getenv("DB_NAME", "user_db"),
#         "USER": os.getenv("DB_USER", "user_user"),
#         "PASSWORD": os.getenv("DB_PASSWORD", "user_pass"),
#         "HOST": os.getenv("DB_HOST", "mentora_postgres_user"),  # <--- DOCKER HOST
#         "PORT": os.getenv("DB_PORT", "5432"),
#     }
# }

# # ===============================
# # REST FRAMEWORK
# # ===============================
# REST_FRAMEWORK = {
#     "DEFAULT_AUTHENTICATION_CLASSES": [],
# }

# # ===============================
# # INTERNATIONALIZATION
# # ===============================
# LANGUAGE_CODE = "en-us"
# TIME_ZONE = "UTC"
# USE_I18N = True
# USE_TZ = True

# # ===============================
# # STATIC FILES
# # ===============================
# STATIC_URL = "static/"

# DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# # ===============================
# # CELERY CONFIG
# # ===============================
# CELERY_BROKER_URL = os.getenv("RABBITMQ_URL", "amqp://guest:guest@mentora_rabbitmq:5672/")
# CELERY_RESULT_BACKEND = os.getenv("REDIS_URL", "redis://mentora_redis:6379/0")

# CELERY_ACCEPT_CONTENT = ["json"]
# CELERY_TASK_SERIALIZER = "json"
# CELERY_RESULT_SERIALIZER = "json"

# # ===============================
# # EMAIL CONFIG
# # ===============================
# DEFAULT_FROM_EMAIL = os.getenv("DEFAULT_FROM_EMAIL", "no-reply@mentora.com")
# EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
# EMAIL_HOST = "smtp.gmail.com"
# EMAIL_PORT = 587
# EMAIL_USE_TLS = True
# EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER")
# EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD")

# ADMIN_NOTIFICATION_EMAIL = os.getenv("ADMIN_NOTIFICATION_EMAIL", "admin@mentora.com")

# # ===============================
# # INTERNAL SERVICES CONFIG
# # ===============================
# AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://mentora_auth_service:8000")

# # ===============================
# # CORS
# # ===============================
# CORS_ALLOWED_ORIGINS = [
#     "http://localhost:5173",
#     "http://localhost:5174",
#     "http://127.0.0.1:5173",
#     "http://127.0.0.1:5174",
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



import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

# ==========================================================
# CORE SECURITY
# ==========================================================
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret")
DEBUG = os.getenv("DEBUG", "True") == "True"

ALLOWED_HOSTS = [
    "*",
    "localhost",
    "127.0.0.1",
    "mentora_user_service",
]

# ==========================================================
# APPLICATIONS
# ==========================================================
INSTALLED_APPS = [
    # Django
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    # Third-party
    "rest_framework",
    "corsheaders",

    # Local
    "profiles.apps.ProfilesConfig",

]

# ==========================================================
# MIDDLEWARE
# ==========================================================
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "user_service_project.urls"

# ==========================================================
# TEMPLATES
# ==========================================================
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

WSGI_APPLICATION = "user_service_project.wsgi.application"

# ==========================================================
# DATABASE (POSTGRESQL)
# ==========================================================
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

# ==========================================================
# REST FRAMEWORK (JWT VERIFIED ELSEWHERE)
# ==========================================================
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [],
    "DEFAULT_PERMISSION_CLASSES": [],
}

# ==========================================================
# INTERNATIONALIZATION
# ==========================================================
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

# ==========================================================
# STATIC FILES
# ==========================================================
STATIC_URL = "/static/"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ==========================================================
# CELERY CONFIG
# ==========================================================
CELERY_BROKER_URL = os.getenv("RABBITMQ_URL")
CELERY_RESULT_BACKEND = os.getenv("REDIS_URL")

CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_TIMEZONE = "UTC"

# ==========================================================
# EMAIL CONFIG
# ==========================================================
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = "smtp.gmail.com"
EMAIL_PORT = 587
EMAIL_USE_TLS = True

EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD")

DEFAULT_FROM_EMAIL = os.getenv("DEFAULT_FROM_EMAIL")
ADMIN_NOTIFICATION_EMAIL = os.getenv("ADMIN_NOTIFICATION_EMAIL")

# ==========================================================
# INTERNAL SERVICES
# ==========================================================
AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL")

# ==========================================================
# CORS
# ==========================================================
CORS_ALLOW_CREDENTIALS = True

CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
]

CORS_ALLOW_HEADERS = [
    "accept",
    "authorization",
    "content-type",
    "user-agent",
    "x-csrftoken",
    "x-requested-with",
]

CORS_ALLOW_METHODS = [
    "DELETE",
    "GET",
    "OPTIONS",
    "PATCH",
    "POST",
    "PUT",
]
