"""
app/ai_engine/srts_scoring.py - Severity Rating Tracking System (SRTS)
AI-powered mental health severity assessment engine
"""

from typing import Dict, List
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class SRTSEngine:
    """
    Severity Rating Tracking System (SRTS)
    
    Analyzes mental health questionnaire responses and creates comprehensive triage profiles
    """
    
    # Question weights (importance factor for each question)
    QUESTION_WEIGHTS = {
        1: 1.0,   # Little interest or pleasure
        2: 1.2,   # Feeling down, depressed, hopeless
        3: 0.9,   # Sleep problems
        4: 0.8,   # Feeling tired or low energy
        5: 0.9,   # Poor appetite or overeating
        6: 1.1,   # Feeling bad about yourself
        7: 0.9,   # Trouble concentrating
        8: 0.8,   # Moving or speaking slowly/restless
        9: 1.5,   # Self-harm thoughts (HIGH PRIORITY)
        10: 1.0,  # Difficulty functioning
    }
    
    # Severity thresholds
    SEVERITY_LEVELS = {
        "minimal": (0, 4),
        "mild": (5, 9),
        "moderate": (10, 14),
        "moderately_severe": (15, 19),
        "severe": (20, 27)
    }
    
    # Specialist routing based on severity
    SPECIALIST_ROUTING = {
        "minimal": "counselor",
        "mild": "counselor",
        "moderate": "psychologist",
        "moderately_severe": "psychologist",
        "severe": "psychiatrist"
    }
    
    @classmethod
    def create_triage_profile(cls, responses: Dict[int, int]) -> Dict:
        """
        Create a comprehensive triage profile from questionnaire responses
        
        Args:
            responses: Dictionary of {question_number: score}
                      Scores range from 0-3 for each question
        
        Returns:
            Triage profile with severity, red flags, dominant symptoms, and urgency
        """
        # Convert string keys to integers if needed
        if responses and isinstance(next(iter(responses)), str):
            responses = {int(k): v for k, v in responses.items()}
        
        # Calculate weighted score
        raw_score = 0
        for question_num, score in responses.items():
            weight = cls.QUESTION_WEIGHTS.get(question_num, 1.0)
            raw_score += score * weight
        
        # Round to integer
        raw_score = int(round(raw_score))
        
        # Determine severity level
        severity_level = cls._get_severity_level(raw_score)
        
        # Check for red flags
        red_flags = cls._identify_red_flags(responses)
        
        # Identify dominant symptoms
        dominant_symptoms = cls._identify_dominant_symptoms(responses)
        
        # Determine urgency level
        urgency_level = cls._determine_urgency_level(severity_level, red_flags)
        
        # Apply rule-based overrides
        specialist_type = cls._apply_rule_based_overrides(responses, red_flags, severity_level)
        
        # Calculate confidence score
        confidence_score = cls._calculate_confidence_score(responses, red_flags)
        
        # Generate recommendations
        recommendations = cls._generate_recommendations(
            severity_level, 
            red_flags.get('high_risk', False), 
            responses
        )
        
        # Check if confidence is below threshold (kill switch)
        confidence_threshold = 0.6  # Configurable threshold
        requires_manual_review = confidence_score < confidence_threshold
        
        triage_profile = {
            "severity_score": raw_score,
            "severity_level": severity_level,
            "red_flags": red_flags,
            "dominant_symptoms": dominant_symptoms,
            "urgency_level": urgency_level,
            "specialist_type": specialist_type,
            "recommendations": recommendations,
            "assessed_at": datetime.utcnow().isoformat(),
            "confidence_score": confidence_score,
            "requires_manual_review": requires_manual_review,
            "triage_version": "v1",
            "decision_locked": True,  # Prevent any modifications to this decision
            "immutable": True      # Mark as immutable
        }
        
        logger.info(f"Triage Profile: Score={raw_score}, Level={severity_level}, Urgency={urgency_level}, Specialist={specialist_type}, Confidence={confidence_score:.2f}")
        
        # Log if manual review is required
        if requires_manual_review:
            logger.warning(f"Low confidence triage for user - requires manual review: {confidence_score:.2f}")
        
        return triage_profile
    
    @classmethod
    def _calculate_confidence_score(cls, responses: Dict[int, int], red_flags: Dict) -> float:
        """
        Calculate confidence in the triage assessment.
        
        Args:
            responses: Questionnaire responses
            red_flags: Identified red flags
        
        Returns:
            Confidence score (0.0 to 1.0)
        """
        # Base confidence on number of high-scoring responses
        high_responses = sum(1 for score in responses.values() if score >= 2)
        total_responses = len(responses)
        
        # High confidence if many symptoms are present
        response_confidence = min(1.0, high_responses / max(1, total_responses * 0.5))  # At least half should have some symptoms
        
        # Red flags increase confidence in severity
        if red_flags.get('high_risk'):
            return min(1.0, response_confidence + 0.3)  # Boost confidence for clear risk
        
        # If severity is very high or very low, confidence is higher
        raw_score = sum(score * cls.QUESTION_WEIGHTS.get(q, 1.0) for q, score in responses.items())
        if raw_score >= 20 or raw_score <= 4:  # Clear severe or minimal cases
            return min(1.0, response_confidence + 0.2)
        
        # Otherwise, return base confidence
        return response_confidence
    
    @classmethod
    def _identify_red_flags(cls, responses: Dict[int, int]) -> Dict:
        """Identify critical red flags that require immediate attention"""
        return {
            "suicidal_ideation": responses.get(9, 0) >= 2,  # Question 9: self-harm thoughts
            "self_harm_history": responses.get(9, 0) >= 1,  # Any indication
            "psychosis_indicators": responses.get(8, 0) >= 2 and responses.get(2, 0) >= 2,  # Psychomotor + mood issues
            "high_risk": responses.get(9, 0) >= 2
        }
    
    @classmethod
    def _identify_dominant_symptoms(cls, responses: Dict[int, int]) -> List[str]:
        """Identify the most prominent symptoms based on scores"""
        symptoms = []
        
        # Sleep issues (Q3)
        if responses.get(3, 0) >= 2:
            symptoms.append("sleep")
        
        # Mood issues (Q2)
        if responses.get(2, 0) >= 2:
            symptoms.append("mood")
        
        # Anxiety/concentration (Q7)
        if responses.get(7, 0) >= 2:
            symptoms.append("concentration")
        
        # Appetite issues (Q5)
        if responses.get(5, 0) >= 2:
            symptoms.append("appetite")
        
        # Energy issues (Q4)
        if responses.get(4, 0) >= 2:
            symptoms.append("energy")
        
        return symptoms
    
    @classmethod
    def _determine_urgency_level(cls, severity_level: str, red_flags: Dict) -> str:
        """Determine urgency level based on severity and red flags"""
        if red_flags.get("high_risk"):
            return "immediate"
        elif severity_level in ["severe", "moderately_severe"]:
            return "urgent"
        elif severity_level == "moderate":
            return "soon"
        else:
            return "routine"
    
    @classmethod
    def _apply_rule_based_overrides(cls, responses: Dict[int, int], red_flags: Dict, severity_level: str) -> str:
        """Apply rule-based overrides to specialist routing"""
        # Hard overrides that ignore severity scores
        if red_flags.get("suicidal_ideation") or red_flags.get("psychosis_indicators"):
            return "psychiatrist"
        
        # Chronic duration override (if available in responses)
        # This would require additional questions about duration
        # For now, we'll use a placeholder based on high scores over time
        
        # Default routing based on severity
        return cls.SPECIALIST_ROUTING.get(severity_level, "counselor")
    
    @classmethod
    def calculate_severity(cls, responses: Dict[int, int]) -> Dict:
        """
        Calculate severity score and level from questionnaire responses
        
        This method is kept for backward compatibility but now uses the triage profile
        """
        triage_profile = cls.create_triage_profile(responses)
        
        # Return the original format for backward compatibility
        return {
            "raw_score": triage_profile["severity_score"],
            "severity_level": triage_profile["severity_level"],
            "specialist_type": triage_profile["specialist_type"],
            "high_risk": triage_profile["red_flags"].get("high_risk", False),
            "recommendations": triage_profile["recommendations"],
            "assessed_at": triage_profile["assessed_at"]
        }
    
    @classmethod
    def _get_severity_level(cls, score: int) -> str:
        """Determine severity level from score"""
        for level, (min_score, max_score) in cls.SEVERITY_LEVELS.items():
            if min_score <= score <= max_score:
                return level
        return "severe"  # Default to severe if out of range
    
    @classmethod
    def _generate_recommendations(
        cls, 
        severity_level: str, 
        high_risk: bool, 
        responses: Dict[int, int]
    ) -> List[str]:
        """Generate personalized recommendations based on assessment"""
        # Convert string keys to integers if needed
        if responses and isinstance(next(iter(responses)), str):
            responses = {int(k): v for k, v in responses.items()}
        
        recommendations = []
        
        # High risk recommendations (PRIORITY)
        if high_risk:
            recommendations.extend([
                "⚠️ IMMEDIATE ATTENTION: Please contact a mental health professional immediately",
                "📞 Crisis Support: Call 988 (Suicide & Crisis Lifeline) if you're in the US",
                "🏥 Consider visiting emergency services if you feel you may harm yourself"
            ])
        
        # Severity-based recommendations
        if severity_level in ["severe", "moderately_severe"]:
            recommendations.extend([
                "🩺 Professional consultation recommended within 24-48 hours",
                "💊 Psychiatric evaluation may be beneficial",
                "👥 Inform trusted family member or friend about your situation"
            ])
        elif severity_level == "moderate":
            recommendations.extend([
                "🧠 Consider scheduling appointment with psychologist",
                "📝 Start journaling your thoughts and feelings",
                "🏃 Incorporate daily physical activity (30 mins walking)"
            ])
        else:  # mild or minimal
            recommendations.extend([
                "🗣️ Talk therapy with counselor may be helpful",
                "🧘 Practice mindfulness or meditation (10 mins daily)",
                "😴 Maintain regular sleep schedule (7-8 hours)"
            ])
        
        # Symptom-specific recommendations
        if responses.get(3, 0) >= 2:  # Sleep problems
            recommendations.append("💤 Focus on sleep hygiene: consistent bedtime, no screens before sleep")
        
        if responses.get(5, 0) >= 2:  # Appetite issues
            recommendations.append("🥗 Maintain regular meal times, eat balanced nutrition")
        
        if responses.get(7, 0) >= 2:  # Concentration issues
            recommendations.append("🎯 Break tasks into smaller steps, use timers for focus (Pomodoro technique)")
        
        return recommendations
    
    @classmethod
    def analyze_trends(cls, severity_logs: List[Dict]) -> Dict:
        """
        Analyze severity trends over time
        
        Args:
            severity_logs: List of previous severity assessments
        
        Returns:
            Trend analysis with insights
        """
        if not severity_logs or len(severity_logs) < 2:
            return {
                "trend": "insufficient_data",
                "insight": "Need more assessments to analyze trends"
            }
        
        # Sort by date
        sorted_logs = sorted(severity_logs, key=lambda x: x.get("created_at", ""))
        
        # Get recent scores
        recent_scores = [log.get("raw_score", 0) for log in sorted_logs[-5:]]
        
        # Calculate trend
        if len(recent_scores) >= 2:
            first_half_avg = sum(recent_scores[:len(recent_scores)//2]) / (len(recent_scores)//2)
            second_half_avg = sum(recent_scores[len(recent_scores)//2:]) / (len(recent_scores) - len(recent_scores)//2)
            
            difference = second_half_avg - first_half_avg
            
            if difference < -2:
                trend = "improving"
                insight = "✅ Your mental health shows signs of improvement. Keep up the good work!"
            elif difference > 2:
                trend = "worsening"
                insight = "⚠️ Your symptoms appear to be worsening. Please consult with your specialist."
            else:
                trend = "stable"
                insight = "➡️ Your condition appears stable. Continue current treatment plan."
        else:
            trend = "stable"
            insight = "Monitoring your progress. Keep taking regular assessments."
        
        return {
            "trend": trend,
            "insight": insight,
            "recent_scores": recent_scores,
            "assessment_count": len(severity_logs)
        }