# ==================== app/routes/severity.py ====================
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
from app.core.security import get_current_user_id
from app.core.database import get_database
from app.ai_engine.langchain_rag_engine import get_langchain_rag_engine
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


# Request/Response Models
class SymptomInput(BaseModel):
    """Natural language symptom input for RAG analysis"""
    symptoms: str = Field(..., description="Natural language description of symptoms")
    duration: Optional[str] = Field(None, description="Duration of symptoms (e.g., '3 weeks', '2 months')")
    additional_context: Optional[str] = Field(None, description="Any additional context")


class SymptomAnalysis(BaseModel):
    """RAG-powered symptom analysis result"""
    severity: str
    confidence: str
    symptoms_detected: List[str]
    advice: List[str]
    recommended_specialist: str
    reasoning: str
    urgency: str
    crisis_detected: bool
    sources: Optional[List[str]] = None
    analysis_id: Optional[str] = None


@router.get("/current")
async def get_current_severity(user_id: str = Depends(get_current_user_id)):
    """Get user's current severity level"""
    db = get_database()
    
    latest = await db.severity_logs.find_one(
        {"user_id": user_id},
        sort=[("created_at", -1)]
    )
    
    if not latest:
        return {"severity_level": None, "message": "No assessment found"}
    
    return {
        "severity_level": latest.get("severity_level"),
        "specialist_type": latest.get("specialist_type"),
        "assessed_at": latest.get("created_at")
    }


@router.post("/analyze-symptoms", response_model=SymptomAnalysis)
async def analyze_symptoms(
    symptom_input: SymptomInput,
    user_id: str = Depends(get_current_user_id)
):
    """
    Analyze symptoms using RAG and provide intelligent recommendations
    
    This endpoint uses LangChain RAG to:
    1. Search mental health knowledge base for relevant information
    2. Analyze symptom severity using AI
    3. Provide personalized coping advice
    4. Recommend appropriate specialist
    5. Detect crisis situations
    
    Returns structured analysis with reasoning and sources.
    """
    try:
        logger.info(f"RAG symptom analysis requested by user {user_id}")
        
        # Get RAG engine
        rag_engine = get_langchain_rag_engine()
        
        # Analyze symptoms
        analysis = rag_engine.analyze_symptoms(
            symptom_text=symptom_input.symptoms,
            duration=symptom_input.duration,
            additional_context=symptom_input.additional_context
        )
        
        # Check for errors in analysis
        if "error" in analysis:
            raise HTTPException(
                status_code=500,
                detail=f"Analysis error: {analysis['error']}"
            )
        
        # Store analysis in database
        db = get_database()
        
        analysis_log = {
            "user_id": user_id,
            "symptom_input": symptom_input.symptoms,
            "duration": symptom_input.duration,
            "additional_context": symptom_input.additional_context,
            "analysis": analysis,
            "created_at": datetime.utcnow(),
            "analysis_type": "rag_symptom_analysis"
        }
        
        result = await db.severity_logs.insert_one(analysis_log)
        analysis_id = str(result.inserted_id)
        
        logger.info(f"RAG analysis complete: Severity={analysis['severity']}, Crisis={analysis.get('crisis_detected', False)}")
        
        # If crisis detected, log warning
        if analysis.get("crisis_detected", False):
            logger.warning(f"⚠️ CRISIS DETECTED in RAG analysis for user {user_id}")
        
        # Return structured response
        return SymptomAnalysis(
            analysis_id=analysis_id,
            **analysis
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in RAG symptom analysis: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to analyze symptoms: {str(e)}"
        )


@router.get("/analysis-history")
async def get_analysis_history(
    limit: int = 10,
    user_id: str = Depends(get_current_user_id)
):
    """
    Get user's RAG symptom analysis history
    
    Returns previous RAG-based analyses with trends
    """
    db = get_database()
    
    # Fetch RAG analyses
    cursor = db.severity_logs.find(
        {
            "user_id": user_id,
            "analysis_type": "rag_symptom_analysis"
        }
    ).sort("created_at", -1).limit(limit)
    
    analyses = await cursor.to_list(length=limit)
    
    # Format response
    formatted_analyses = []
    for analysis in analyses:
        analysis["_id"] = str(analysis["_id"])
        formatted_analyses.append(analysis)
    
    return {
        "analyses": formatted_analyses,
        "total_count": len(formatted_analyses)
    }
