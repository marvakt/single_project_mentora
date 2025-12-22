"""
app/core/config.py - Configuration Management
"""

from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    """Application settings"""
    
    # Service Info
    SERVICE_NAME: str = "medical_service"
    VERSION: str = "1.0.0"
    
    # MongoDB
    MONGO_URI: str = os.getenv("MONGO_URI", "mongodb://mongo_medical:27017")
    MONGO_DB: str = os.getenv("MONGO_DB", "mentora_medical")
    
    # Security
    JWT_SECRET: str = os.getenv("JWT_SECRET", "mentora-jwt-secret-2025-change-this")
    JWT_ALGORITHM: str = "HS256"
    ENCRYPTION_KEY: str = os.getenv("ENCRYPTION_KEY", "mentora-encryption-key-32bytes!")
    
    # RabbitMQ
    RABBITMQ_URL: str = os.getenv("RABBITMQ_URL", "amqp://guest:guest@rabbitmq:5672/")
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
    ]
    
    # AI Settings
    HIGH_RISK_THRESHOLD: int = 15  # Score above this triggers high-risk alert
    SEVERE_THRESHOLD: int = 20
    MODERATE_THRESHOLD: int = 10
    
    # External Services
    USER_SERVICE_URL: str = os.getenv("USER_SERVICE_URL", "http://user-service:8001")
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()