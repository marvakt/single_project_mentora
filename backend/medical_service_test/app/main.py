from fastapi import FastAPI

from app.core.config import settings
from app.core.database import mongodb
from app.routes import severity, mood, symptom, summary

# ✅ VERSIONED API ROUTERS
from app.api.v1.severity import router as severity_router
from app.api.v1.summary import router as summary_router
from app.api.v1.questionnaire import router as questionnaire_router

app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
)


# ==============================
# LIFECYCLE EVENTS
# ==============================
@app.on_event("startup")
def startup_event():
    mongodb.connect()


@app.on_event("shutdown")
def shutdown_event():
    mongodb.close()


# ==============================
# HEALTH CHECK
# ==============================
@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "env": settings.app_env,
    }


# ==============================
# VERSIONED MEDICAL APIs
# ==============================
app.include_router(severity_router, prefix="/api/v1")
app.include_router(summary_router, prefix="/api/v1")
app.include_router(questionnaire_router, prefix="/api/v1")

# Legacy, non-versioned routes (kept for backward compatibility)
app.include_router(symptom.router)
app.include_router(summary.router)
