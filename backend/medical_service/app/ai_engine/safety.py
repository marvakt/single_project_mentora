"""
app/ai_engine/safety.py - Safety filters and guardrails for RAG system
"""

import logging

logger = logging.getLogger(__name__)


class SafetyViolation(Exception):
    """Raised when RAG output violates safety rules"""
    pass


# FIX #4: Post-generation safety filter
FORBIDDEN_CRISIS_TERMS = [
    "suicide",
    "suicidal",
    "kill myself",
    "end my life",
    "self-harm",
    "hurt myself",
    "cutting",
    "overdose"
]


def validate_non_crisis_output(response_text: str) -> None:
    """
    Validate that LLM output doesn't contain crisis language in non-crisis path.
    
    This is a HARD CONTROL - prompts alone are not sufficient.
    
    Raises:
        SafetyViolation: If forbidden terms are detected
    """
    response_lower = response_text.lower()
    
    for term in FORBIDDEN_CRISIS_TERMS:
        if term in response_lower:
            logger.error(f"SAFETY VIOLATION: Crisis term '{term}' leaked into non-crisis RAG output")
            raise SafetyViolation(
                f"Crisis language detected in supportive path: '{term}'. "
                "This output has been blocked for safety."
            )


# Clinical boundaries (code-enforced, not just documentation)
CLINICAL_BOUNDARIES = {
    "never_diagnose": True,
    "never_prescribe": True,
    "never_replace_professional": True,
    "always_escalate_crisis": True,
    "always_attribute_sources": True,
    "always_show_confidence": True,
    "is_clinical_tool": False  # Explicit: this is wellness support, not clinical diagnosis
}
