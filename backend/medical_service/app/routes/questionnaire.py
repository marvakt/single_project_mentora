"""
app/routes/questionnaire.py - Mental Health Questionnaire API
PHQ-9 based depression/anxiety screening questionnaire
"""

import logging
from datetime import datetime
from typing import Dict, List, Optional

import httpx
from app.ai_engine.srts_scoring import SRTSEngine
from app.core.config import settings
from app.core.database import get_database
from app.core.encryption import ENCRYPTED_FIELDS, encryption
from app.core.security import get_current_user_id
from app.messaging.celery_client import send_high_risk_alert
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

router = APIRouter()


# Request/Response Models
class QuestionnaireResponse(BaseModel):
    """User's responses to questionnaire"""
    responses: Dict[int, int] = Field(
        ..., 
        description="Dictionary of question_number: score (0-3)"
    )
    notes: str = Field(default="", description="Optional additional notes")


class SeverityResult(BaseModel):
    """Severity assessment result"""
    severity_id: str
    raw_score: int
    severity_level: str
    specialist_type: str
    high_risk: bool
    recommendations: List[str]
    assessed_at: str
    suggested_doctors: Optional[List[Dict]] = None
    recommendation_snapshot_id: Optional[str] = None
    confidence_score: Optional[float] = None
    requires_manual_review: Optional[bool] = None
    rag_insights: Optional[Dict] = None


# Questionnaire questions (PHQ-9 based)
QUESTIONNAIRE = [
    {
        "id": 1,
        "question": "Little interest or pleasure in doing things?",
        "category": "interest"
    },
    {
        "id": 2,
        "question": "Feeling down, depressed, or hopeless?",
        "category": "mood"
    },
    {
        "id": 3,
        "question": "Trouble falling or staying asleep, or sleeping too much?",
        "category": "sleep"
    },
    {
        "id": 4,
        "question": "Feeling tired or having little energy?",
        "category": "energy"
    },
    {
        "id": 5,
        "question": "Poor appetite or overeating?",
        "category": "appetite"
    },
    {
        "id": 6,
        "question": "Feeling bad about yourself or that you are a failure?",
        "category": "self_esteem"
    },
    {
        "id": 7,
        "question": "Trouble concentrating on things?",
        "category": "concentration"
    },
    {
        "id": 8,
        "question": "Moving or speaking slowly, or being fidgety/restless?",
        "category": "psychomotor"
    },
    {
        "id": 9,
        "question": "Thoughts that you would be better off dead, or hurting yourself?",
        "category": "self_harm",
        "warning": "⚠️ If you're experiencing these thoughts, please seek immediate help"
    },
    {
        "id": 10,
        "question": "How difficult have these problems made it to function?",
        "category": "functioning"
    }
]

ANSWER_OPTIONS = [
    {"value": 0, "label": "Not at all"},
    {"value": 1, "label": "Several days"},
    {"value": 2, "label": "More than half the days"},
    {"value": 3, "label": "Nearly every day"}
]


@router.get("/questions")
async def get_questions():
    """
    Get mental health questionnaire questions
    
    Returns standardized PHQ-9 questionnaire for depression/anxiety screening
    """
    return {
        "questionnaire": QUESTIONNAIRE,
        "answer_options": ANSWER_OPTIONS,
        "instructions": "Over the last 2 weeks, how often have you been bothered by the following problems?",
        "total_questions": len(QUESTIONNAIRE)
    }


@router.post("/submit", response_model=SeverityResult)
async def submit_questionnaire(
    questionnaire_data: QuestionnaireResponse,
    user_id: str = Depends(get_current_user_id),
    enable_rag: bool = False  # Optional RAG enhancement - default to False for performance
):
    """
    Submit questionnaire and calculate severity score
    
    - Validates responses
    - Calculates SRTS severity score
    - Optionally enhances with RAG insights
    - Stores encrypted assessment
    - Triggers high-risk alerts if needed
    - Returns specialist recommendation and suggested doctors based on ratings
    """
    db = get_database()
    
    # Validate responses
    responses = questionnaire_data.responses
    
    if len(responses) != 10:
        raise HTTPException(
            status_code=400,
            detail="All 10 questions must be answered"
        )
    
    # Validate score ranges (0-3)
    for q_num, score in responses.items():
        if not (1 <= q_num <= 10) or not (0 <= score <= 3):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid response for question {q_num}"
            )
    
    # Create comprehensive triage profile using SRTS engine
    triage_profile = SRTSEngine.create_triage_profile(responses)
    
    # For backward compatibility, we'll also create the original severity result
    severity_result = {
        "raw_score": triage_profile["severity_score"],
        "severity_level": triage_profile["severity_level"],
        "specialist_type": triage_profile["specialist_type"],
        "high_risk": triage_profile["red_flags"].get("high_risk", False),
        "recommendations": triage_profile["recommendations"],
        "assessed_at": triage_profile["assessed_at"]
    }
    
    # Optionally enhance with RAG insights (async for performance)
    rag_insights = None
    if enable_rag:
        try:
            # Import and get RAG engine
            from app.ai_engine.langchain_rag_engine import get_langchain_rag_engine
            rag_engine = get_langchain_rag_engine()
            
            # Process RAG enhancement in a non-blocking way
            import asyncio
            from concurrent.futures import ThreadPoolExecutor
            
            def enhance_with_rag():
                try:
                    return rag_engine.enhance_questionnaire_results(responses, severity_result, triage_profile)
                except Exception as e:
                    logger.warning(f"RAG enhancement failed: {e}")
                    return None
            
            # Run RAG enhancement in thread pool to not block the main request
            loop = asyncio.get_event_loop()
            with ThreadPoolExecutor() as executor:
                rag_insights = await loop.run_in_executor(executor, enhance_with_rag)
                
            if rag_insights:
                logger.info(f"RAG insights generated for questionnaire submission")
            
        except Exception as e:
            logger.warning(f"RAG enhancement failed, continuing with SRTS only: {e}")
            rag_insights = None
    
    # Prepare severity log document - convert dict keys to strings for MongoDB
    responses_str_keys = {str(k): v for k, v in responses.items()}
    
    severity_log = {
        "user_id": user_id,
        "responses": responses_str_keys,
        "raw_score": severity_result["raw_score"],
        "severity_level": severity_result["severity_level"],
        "specialist_type": severity_result["specialist_type"],
        "high_risk": severity_result["high_risk"],
        "recommendations": severity_result["recommendations"],
        "notes": questionnaire_data.notes,
        "created_at": datetime.utcnow(),
        "rag_insights": rag_insights,  # Add RAG insights if available
        "triage_profile": triage_profile  # Include the full triage profile
    }
    
    # Encrypt sensitive fields
    encrypted_log = encryption.encrypt_dict(
        severity_log, 
        ENCRYPTED_FIELDS.get("severity_logs", [])
    )
    
    # Store in database
    result = await db.severity_logs.insert_one(encrypted_log)
    severity_id = str(result.inserted_id)
    
    logger.info(f"Severity assessment saved for user {user_id}: {severity_result['severity_level']}")
    
    # Send high-risk alert if needed
    if severity_result["high_risk"]:
        logger.warning(f"⚠️ HIGH RISK detected for user {user_id}")
        try:
            send_high_risk_alert(user_id, severity_result)
        except Exception as e:
            logger.error(f"Failed to send high-risk alert: {e}")
    
    # Get suggested doctors based on triage profile (with timeout)
    suggested_doctors = []
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:  # Reduced timeout
            # Call user service to get doctor suggestions
            # Use internal service authentication token
            headers = {
                "Content-Type": "application/json",
                "X-INTERNAL-TOKEN": settings.INTERNAL_SERVICE_TOKEN
            }
                
            # Send the full triage profile to enable better matching
            response = await client.post(
                f"{settings.USER_SERVICE_URL}/api/doctors/suggest/",
                json={
                    "severity_score": severity_result["raw_score"],
                    "triage_profile": triage_profile  # Send the full triage profile
                },
                headers=headers,
                timeout=5.0  # Shorter timeout to prevent delays
            )
                
            if response.status_code == 200:
                doctor_data = response.json()
                suggested_doctors = doctor_data.get("suggested_doctors", [])
    except Exception as e:
        logger.error(f"Failed to fetch doctor suggestions: {e}")
        # Continue without doctor suggestions if service is unavailable
    
    # Add suggested doctors and RAG insights to the response
    severity_result["suggested_doctors"] = suggested_doctors
    if rag_insights:
        severity_result["rag_insights"] = rag_insights
    
    # Add triage profile information
    severity_result["confidence_score"] = triage_profile.get("confidence_score")
    severity_result["requires_manual_review"] = triage_profile.get("requires_manual_review", False)
    
    # Create a recommendation snapshot for deterministic UX
    try:
        from app.core.database import create_recommendation_snapshot
        snapshot_id = await create_recommendation_snapshot(
            user_id=user_id,
            assessment_id=severity_id,
            triage_profile=triage_profile,
            suggested_doctors=suggested_doctors
        )
        severity_result["recommendation_snapshot_id"] = snapshot_id
    except Exception as e:
        logger.error(f"Failed to create recommendation snapshot: {e}")
        # Continue without snapshot ID if creation fails
    
    return SeverityResult(
        severity_id=severity_id,
        **severity_result
    )


@router.get("/history")
async def get_severity_history(
    limit: int = 10,
    user_id: str = Depends(get_current_user_id)
):
    """
    Get user's severity assessment history
    
    Returns previous assessments with trends analysis
    """
    db = get_database()
    
    # Fetch severity logs
    cursor = db.severity_logs.find(
        {"user_id": user_id}
    ).sort("created_at", -1).limit(limit)
    
    logs = await cursor.to_list(length=limit)
    
    # Decrypt sensitive fields
    decrypted_logs = []
    for log in logs:
        log["_id"] = str(log["_id"])
        decrypted_log = encryption.decrypt_dict(
            log,
            ENCRYPTED_FIELDS.get("severity_logs", [])
        )
        decrypted_logs.append(decrypted_log)
    
    # Analyze trends
    trend_analysis = SRTSEngine.analyze_trends(decrypted_logs)
    
    return {
        "assessments": decrypted_logs,
        "total_count": len(decrypted_logs),
        "trend_analysis": trend_analysis
    }


@router.get("/latest")
async def get_latest_severity(
    user_id: str = Depends(get_current_user_id)
):
    """
    Get user's most recent severity assessment
    
    Returns the latest assessment or None if no assessments exist
    """
    db = get_database()
    
    # Find latest assessment
    latest = await db.severity_logs.find_one(
        {"user_id": user_id},
        sort=[("created_at", -1)]
    )
    
    if not latest:
        return {
            "assessment": None,
            "message": "No assessments found. Please complete a questionnaire."
        }
    
    # Decrypt and return
    latest["_id"] = str(latest["_id"])
    decrypted = encryption.decrypt_dict(
        latest,
        ENCRYPTED_FIELDS.get("severity_logs", [])
    )
    
    return {
        "assessment": decrypted
    }