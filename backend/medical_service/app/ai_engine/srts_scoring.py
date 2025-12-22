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
    
    Analyzes mental health questionnaire responses and calculates severity score
    Routes users to appropriate specialists based on severity level
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
    def calculate_severity(cls, responses: Dict[int, int]) -> Dict:
        """
        Calculate severity score and level from questionnaire responses
        
        Args:
            responses: Dictionary of {question_number: score}
                      Scores range from 0-3 for each question
        
        Returns:
            Dictionary containing:
                - raw_score: Total weighted score
                - severity_level: String classification
                - specialist_type: Recommended specialist
                - high_risk: Boolean flag for suicide risk
                - recommendations: List of recommendations
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
        
        # Get specialist recommendation
        specialist_type = cls.SPECIALIST_ROUTING.get(severity_level, "counselor")
        
        # Check for high-risk indicators (self-harm thoughts)
        high_risk = responses.get(9, 0) >= 2  # Question 9 score >= 2
        
        # Generate recommendations
        recommendations = cls._generate_recommendations(
            severity_level, 
            high_risk, 
            responses
        )
        
        result = {
            "raw_score": raw_score,
            "severity_level": severity_level,
            "specialist_type": specialist_type,
            "high_risk": high_risk,
            "recommendations": recommendations,
            "assessed_at": datetime.utcnow().isoformat()
        }
        
        logger.info(f"SRTS Assessment: Score={raw_score}, Level={severity_level}, Specialist={specialist_type}")
        
        return result
    
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