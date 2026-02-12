"""
app/main.py - FastAPI Medical Service Main Application
Handles mental health assessments, AI scoring, chat, and secure medical data
"""

import logging
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import close_db, connect_db
from app.routes import (
    chat,
    mood,
    questionnaire,
    session_notes,
    severity,
    summary,
    symptom,
    treatment,
)
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup
    logger.info("🚀 Starting Medical Service...")
    await connect_db()
    logger.info("✅ Database connected")

    # Initialize AI Engine in background to avoid blocking critical startup
    # This prepares the model so the first user request is fast
    import asyncio
    try:
        from app.ai_engine.langchain_rag_engine import get_langchain_rag_engine
        logger.info("🧠 Scheduling RAG Engine initialization in background...")
        # Run in background so it doesn't block the server form starting
        asyncio.create_task(asyncio.to_thread(get_langchain_rag_engine))
    except Exception as e:
        logger.warning(f"⚠️ RAG Engine init scheduling failed: {e}")
    
    yield
    
    # Shutdown
    logger.info("🛑 Shutting down Medical Service...")
    await close_db()
    logger.info("✅ Database disconnected")


# Initialize FastAPI app
app = FastAPI(
    title="Mentora Medical Service",
    description="AI-Powered Mental Health Assessment & Guidance System",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "medical_service",
        "version": "1.0.0"
    }


# Include routers
app.include_router(questionnaire.router, prefix="/api/v1/questionnaire", tags=["Questionnaire"])
app.include_router(mood.router, prefix="/api/v1/mood", tags=["Mood Tracking"])
app.include_router(severity.router, prefix="/api/v1/severity", tags=["Severity Analysis"])
app.include_router(symptom.router, prefix="/api/v1/symptoms", tags=["Symptoms"])
app.include_router(summary.router, prefix="/api/v1/summary", tags=["Summary"])
app.include_router(chat.router, prefix="/api/v1/chat", tags=["Chat"])
app.include_router(treatment.router, prefix="/api/v1/treatment", tags=["Treatment Plans"])
app.include_router(session_notes.router, prefix="/api/v1/session-notes", tags=["Session Notes"])


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Mentora Medical Service",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "docs": "/docs",
            "questionnaire": "/api/v1/questionnaire",
            "mood": "/api/v1/mood",
            "severity": "/api/v1/severity",
            "symptoms": "/api/v1/symptoms",
            "chat": "/api/v1/chat",
            "treatment": "/api/v1/treatment",
            "session_notes": "/api/v1/session-notes"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8003,
        reload=True
    )