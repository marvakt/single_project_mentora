"""
Questionnaire API for mental health assessment.
This module handles the questionnaire form, scoring, and doctor suggestions.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any
import logging

from app.ai_engine.srt_scoring import calculate_severity
from app.ai.severity_levels import SeverityLevel

router = APIRouter(prefix="/questionnaire", tags=["questionnaire"])
logger = logging.getLogger(__name__)

# Questionnaire structure
QUESTIONNAIRE_QUESTIONS = [
    {
        "id": "q1",
        "text": "Over the past two weeks, how often have you felt down, depressed, or hopeless?",
        "options": [
            {"value": 0, "label": "Not at all"},
            {"value": 1, "label": "Several days"},
            {"value": 2, "label": "More than half the days"},
            {"value": 3, "label": "Nearly every day"}
        ]
    },
    {
        "id": "q2",
        "text": "Over the past two weeks, how often have you had little interest or pleasure in doing things?",
        "options": [
            {"value": 0, "label": "Not at all"},
            {"value": 1, "label": "Several days"},
            {"value": 2, "label": "More than half the days"},
            {"value": 3, "label": "Nearly every day"}
        ]
    },
    {
        "id": "q3",
        "text": "Over the past two weeks, how often have you felt nervous, anxious, or on edge?",
        "options": [
            {"value": 0, "label": "Not at all"},
            {"value": 1, "label": "Several days"},
            {"value": 2, "label": "More than half the days"},
            {"value": 3, "label": "Nearly every day"}
        ]
    },
    {
        "id": "q4",
        "text": "Over the past two weeks, how often have you felt that you could not stop or control worrying?",
        "options": [
            {"value": 0, "label": "Not at all"},
            {"value": 1, "label": "Several days"},
            {"value": 2, "label": "More than half the days"},
            {"value": 3, "label": "Nearly every day"}
        ]
    },
    {
        "id": "q5",
        "text": "Over the past two weeks, how often have you had trouble relaxing?",
        "options": [
            {"value": 0, "label": "Not at all"},
            {"value": 1, "label": "Several days"},
            {"value": 2, "label": "More than half the days"},
            {"value": 3, "label": "Nearly every day"}
        ]
    },
    {
        "id": "q6",
        "text": "Over the past two weeks, how often have you become easily annoyed or irritable?",
        "options": [
            {"value": 0, "label": "Not at all"},
            {"value": 1, "label": "Several days"},
            {"value": 2, "label": "More than half the days"},
            {"value": 3, "label": "Nearly every day"}
        ]
    },
    {
        "id": "q7",
        "text": "Over the past two weeks, how often have you felt afraid as if something awful might happen?",
        "options": [
            {"value": 0, "label": "Not at all"},
            {"value": 1, "label": "Several days"},
            {"value": 2, "label": "More than half the days"},
            {"value": 3, "label": "Nearly every day"}
        ]
    },
    {
        "id": "q8",
        "text": "Over the past two weeks, how difficult have sleeping problems been for you?",
        "options": [
            {"value": 0, "label": "No difficulty"},
            {"value": 1, "label": "Somewhat difficult"},
            {"value": 2, "label": "Very difficult"},
            {"value": 3, "label": "Extremely difficult"}
        ]
    },
    {
        "id": "q9",
        "text": "Over the past two weeks, how difficult has it been for you to concentrate on tasks?",
        "options": [
            {"value": 0, "label": "No difficulty"},
            {"value": 1, "label": "Somewhat difficult"},
            {"value": 2, "label": "Very difficult"},
            {"value": 3, "label": "Extremely difficult"}
        ]
    },
    {
        "id": "q10",
        "text": "Over the past two weeks, how much has your appetite changed?",
        "options": [
            {"value": 0, "label": "No change"},
            {"value": 1, "label": "Slight change"},
            {"value": 2, "label": "Moderate change"},
            {"value": 3, "label": "Severe change"}
        ]
    }
]

class QuestionnaireResponse(BaseModel):
    answers: Dict[str, int]

class SeverityResult(BaseModel):
    severity_score: int
    severity_level: str
    interpretation: str
    recommendation: str

class DoctorSuggestionRequest(BaseModel):
    severity_score: int
    user_id: int

@router.get("/questions")
async def get_questionnaire_questions():
    """Return the questionnaire questions."""
    return {"questions": QUESTIONNAIRE_QUESTIONS}

@router.post("/calculate-severity", response_model=SeverityResult)
async def calculate_severity_score(response: QuestionnaireResponse):
    """
    Calculate severity score based on questionnaire responses.
    """
    try:
        # Sum all answers (0-3 per question, 10 questions = 0-30 total)
        raw_score = sum(response.answers.values())
        
        # Normalize to 0-10 scale
        normalized_score = min(10, max(0, round((raw_score / 30) * 10)))
        
        # Calculate severity level
        severity_level = calculate_severity(normalized_score)
        
        # Provide interpretation and recommendation
        interpretations = {
            SeverityLevel.LOW: "Your responses suggest mild symptoms. Many people experience periods like this.",
            SeverityLevel.MODERATE: "Your responses indicate moderate symptoms that may be affecting your daily life.",
            SeverityLevel.HIGH: "Your responses suggest significant symptoms that are impacting your well-being.",
            SeverityLevel.CRITICAL: "Your responses indicate severe symptoms that require professional attention."
        }
        
        recommendations = {
            SeverityLevel.LOW: "Consider stress management techniques, regular exercise, and maintaining social connections. Self-help resources may be beneficial.",
            SeverityLevel.MODERATE: "Professional guidance could be helpful. Speaking with a counselor or therapist might provide valuable support.",
            SeverityLevel.HIGH: "We recommend consulting with a mental health professional soon to develop coping strategies.",
            SeverityLevel.CRITICAL: "Professional help is strongly recommended. Please reach out to a healthcare provider as soon as possible."
        }
        
        return SeverityResult(
            severity_score=normalized_score,
            severity_level=severity_level.value,
            interpretation=interpretations.get(severity_level, "Results calculated."),
            recommendation=recommendations.get(severity_level, "Consult with a healthcare professional.")
        )
        
    except Exception as e:
        logger.error(f"Error calculating severity score: {e}")
        raise HTTPException(status_code=500, detail="Error processing questionnaire responses")

@router.post("/suggest-doctors")
async def suggest_doctors(request: DoctorSuggestionRequest):
    """
    Suggest doctors based on severity score and doctor ratings.
    This would typically call the user service API to get doctor suggestions.
    """
    # In a real implementation, this would call the user service
    # For now, we'll return a template response
    return {
        "severity_score": request.severity_score,
        "user_id": request.user_id,
        "message": "In a complete implementation, this would call the user service to get doctor suggestions based on your severity score and doctor ratings."
    }