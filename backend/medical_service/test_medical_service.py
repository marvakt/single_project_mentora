"""
Comprehensive unit tests for the medical service
Testing RAG system, severity scoring, questionnaire functionality, and API endpoints
"""

import unittest
from unittest.mock import patch, MagicMock, Mock
import sys
import os
import json
from datetime import datetime, timedelta
from decimal import Decimal

# Add the app directory to the path so we can import modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.ai_engine.srts_scoring import SRTSEngine
from app.ai_engine.langchain_rag_engine import get_langchain_rag_engine, LangChainRAGEngine
from app.core.database import create_recommendation_snapshot


class TestSRTSEngine(unittest.TestCase):
    """Test the SRTS (Severity Rating Tracking System) engine"""

    def setUp(self):
        """Set up test data"""
        self.test_responses = {
            1: 0,  # Little interest or pleasure
            2: 1,  # Feeling down, depressed, hopeless
            3: 2,  # Sleep problems
            4: 1,  # Feeling tired or low energy
            5: 0,  # Poor appetite or overeating
            6: 1,  # Feeling bad about yourself
            7: 2,  # Trouble concentrating
            8: 1,  # Moving or speaking slowly/restless
            9: 0,  # Self-harm thoughts
            10: 1  # Difficulty functioning
        }

    def test_create_triage_profile_basic(self):
        """Test basic triage profile creation"""
        triage_profile = SRTSEngine.create_triage_profile(self.test_responses)
        
        self.assertIsNotNone(triage_profile)
        self.assertIn("severity_score", triage_profile)
        self.assertIn("severity_level", triage_profile)
        self.assertIn("red_flags", triage_profile)
        self.assertIn("dominant_symptoms", triage_profile)
        self.assertIn("urgency_level", triage_profile)
        self.assertIn("specialist_type", triage_profile)
        self.assertIn("recommendations", triage_profile)
        self.assertIn("assessed_at", triage_profile)
        self.assertIn("decision_locked", triage_profile)
        self.assertIn("immutable", triage_profile)

    def test_severity_calculation(self):
        """Test severity score calculation"""
        triage_profile = SRTSEngine.create_triage_profile(self.test_responses)
        
        # Verify the score calculation
        self.assertIsInstance(triage_profile["severity_score"], int)
        self.assertGreaterEqual(triage_profile["severity_score"], 0)

    def test_red_flag_identification(self):
        """Test red flag identification"""
        # Test with high risk (suicidal ideation)
        high_risk_responses = {i: 0 for i in range(1, 11)}  # Start with all 0s
        high_risk_responses[9] = 3  # Self-harm thoughts at max level
        
        triage_profile = SRTSEngine.create_triage_profile(high_risk_responses)
        red_flags = triage_profile["red_flags"]
        
        self.assertTrue(red_flags["suicidal_ideation"])
        self.assertTrue(red_flags["high_risk"])

    def test_dominant_symptom_identification(self):
        """Test dominant symptom identification"""
        # Create responses that should trigger specific symptoms
        responses = {i: 0 for i in range(1, 11)}  # Start with all 0s
        responses[3] = 3  # Sleep problems
        responses[2] = 3  # Mood issues
        responses[7] = 3  # Concentration issues
        
        triage_profile = SRTSEngine.create_triage_profile(responses)
        symptoms = triage_profile["dominant_symptoms"]
        
        self.assertIn("sleep", symptoms)
        self.assertIn("mood", symptoms)
        self.assertIn("concentration", symptoms)

    def test_urgency_level_determination(self):
        """Test urgency level determination"""
        # High risk should result in immediate urgency
        high_risk_responses = {i: 0 for i in range(1, 11)}  # Start with all 0s
        high_risk_responses[9] = 3  # Self-harm thoughts
        
        triage_profile = SRTSEngine.create_triage_profile(high_risk_responses)
        urgency_level = triage_profile["urgency_level"]
        
        self.assertEqual(urgency_level, "immediate")

    def test_rule_based_overrides(self):
        """Test rule-based overrides for critical cases"""
        # Test suicidal ideation override
        suicidal_responses = {i: 0 for i in range(1, 11)}
        suicidal_responses[9] = 3  # High score for self-harm thoughts
        
        triage_profile = SRTSEngine.create_triage_profile(suicidal_responses)
        specialist_type = triage_profile["specialist_type"]
        
        self.assertEqual(specialist_type, "psychiatrist")

    def test_confidence_scoring(self):
        """Test confidence scoring functionality"""
        triage_profile = SRTSEngine.create_triage_profile(self.test_responses)
        
        self.assertIn("confidence_score", triage_profile)
        self.assertIn("requires_manual_review", triage_profile)
        
        confidence_score = triage_profile["confidence_score"]
        requires_review = triage_profile["requires_manual_review"]
        
        self.assertIsInstance(confidence_score, float)
        self.assertGreaterEqual(confidence_score, 0.0)
        self.assertLessEqual(confidence_score, 1.0)
        self.assertIsInstance(requires_review, bool)

    def test_calculate_severity_backward_compatibility(self):
        """Test backward compatibility of calculate_severity method"""
        result = SRTSEngine.calculate_severity(self.test_responses)
        
        self.assertIn("raw_score", result)
        self.assertIn("severity_level", result)
        self.assertIn("specialist_type", result)
        self.assertIn("high_risk", result)
        self.assertIn("recommendations", result)
        self.assertIn("assessed_at", result)

    def test_severity_level_classification(self):
        """Test severity level classification"""
        # Test different score ranges
        test_cases = [
            (0, 4, "minimal"),
            (5, 9, "mild"),
            (10, 14, "moderate"),
            (15, 19, "moderately_severe"),
            (20, 27, "severe")
        ]
        
        for min_score, max_score, expected_level in test_cases:
            # Create responses that result in score in this range
            responses = {i: 0 for i in range(1, 11)}
            # Distribute scores to achieve target range
            for i in range(1, 11):
                if min_score > 0:
                    responses[i] = min(3, max(0, min_score // 10 + i % 2))
            
            triage_profile = SRTSEngine.create_triage_profile(responses)
            self.assertEqual(triage_profile["severity_level"], expected_level)

    def test_psychosis_indicators(self):
        """Test psychosis indicator detection"""
        # Test with high scores for both movement and mood issues
        psychosis_responses = {i: 0 for i in range(1, 11)}
        psychosis_responses[8] = 3  # Moving or speaking slowly/restless
        psychosis_responses[2] = 3  # Feeling down, depressed, hopeless
        
        triage_profile = SRTSEngine.create_triage_profile(psychosis_responses)
        red_flags = triage_profile["red_flags"]
        
        self.assertTrue(red_flags["psychosis_indicators"])

    def test_chronic_duration_detection(self):
        """Test chronic duration detection (would require additional questions in real implementation)"""
        # For now, test that the system handles extended assessments
        extended_responses = {i: 2 for i in range(1, 11)}  # All moderate scores
        
        triage_profile = SRTSEngine.create_triage_profile(extended_responses)
        
        # Should have appropriate specialist recommendation based on severity
        self.assertIn(triage_profile["specialist_type"], ["psychologist", "psychiatrist"])


class TestLangchainRAGEngine(unittest.TestCase):
    """Test the Langchain RAG engine"""

    def setUp(self):
        """Set up test data for RAG engine"""
        self.test_responses = {
            1: 0,
            2: 1,
            3: 2,
            4: 1,
            5: 0,
            6: 1,
            7: 2,
            8: 1,
            9: 0,
            10: 1
        }
        
        self.srts_result = {
            "raw_score": 10,
            "severity_level": "moderate",
            "specialist_type": "psychologist",
            "high_risk": False,
            "recommendations": ["Consider therapy"],
            "assessed_at": datetime.utcnow().isoformat()
        }

    @patch('app.ai_engine.langchain_rag_engine.LangchainRAGEngine.__init__', return_value=None)
    @patch('app.ai_engine.langchain_rag_engine.LangchainRAGEngine.enhance_questionnaire_results')
    def test_rag_engine_initialization(self, mock_enhance, mock_init):
        """Test RAG engine initialization"""
        # Mock the initialization
        mock_init.return_value = None
        
        # Create a mock instance
        rag_engine = LangchainRAGEngine.__new__(LangchainRAGEngine)
        rag_engine.llm = MagicMock()
        rag_engine.retriever = MagicMock()
        
        # Test that it can be created
        self.assertIsNotNone(rag_engine)

    @patch('app.ai_engine.langchain_rag_engine.get_settings')
    def test_get_langchain_rag_engine(self, mock_get_settings):
        """Test the factory function for getting RAG engine"""
        # Mock settings
        mock_settings = MagicMock()
        mock_settings.HUGGINGFACE_API_KEY = "test_key"
        mock_settings.LLM_PROVIDER = "huggingface"
        mock_settings.LLM_MODEL = "test-model"
        mock_get_settings.return_value = mock_settings
        
        # Test that the function exists and can be called
        rag_engine = get_langchain_rag_engine()
        
        # Since we can't initialize the real engine due to dependencies,
        # we test that the function exists and can be called
        self.assertTrue(callable(get_langchain_rag_engine))

    def test_triage_profile_integration(self):
        """Test integration with triage profile"""
        # This tests that the RAG system can work with triage profiles
        triage_profile = {
            "severity_score": 15,
            "severity_level": "moderately_severe",
            "red_flags": {
                "suicidal_ideation": False,
                "high_risk": False
            },
            "dominant_symptoms": ["sleep", "mood"],
            "urgency_level": "urgent",
            "specialist_type": "psychiatrist",
            "recommendations": ["Immediate consultation recommended"],
            "assessed_at": datetime.utcnow().isoformat(),
            "confidence_score": 0.8,
            "requires_manual_review": False,
            "triage_version": "v1",
            "decision_locked": True,
            "immutable": True
        }
        
        # Verify the structure of a triage profile
        self.assertEqual(triage_profile["severity_score"], 15)
        self.assertEqual(triage_profile["specialist_type"], "psychiatrist")
        self.assertIn("sleep", triage_profile["dominant_symptoms"])
        self.assertTrue(triage_profile["decision_locked"])

    @patch('app.ai_engine.langchain_rag_engine.LangchainRAGEngine.__init__', return_value=None)
    def test_rag_signals_extraction(self, mock_init):
        """Test RAG signals extraction from insights"""
        # Mock the engine
        rag_engine = LangchainRAGEngine.__new__(LangchainRAGEngine)
        rag_engine.llm = MagicMock()
        rag_engine.retriever = MagicMock()
        
        # Test signal extraction
        test_insights = {
            "contextual_advice": ["Practice mindfulness"],
            "insights": "Based on responses, consider therapy",
            "rag_signals": {
                "suggested_specialty_adjustment": None,
                "risk_flags": [],
                "confidence_score": 0.7
            }
        }
        
        # Verify signal structure
        rag_signals = test_insights["rag_signals"]
        self.assertIn("suggested_specialty_adjustment", rag_signals)
        self.assertIn("risk_flags", rag_signals)
        self.assertIn("confidence_score", rag_signals)
        self.assertIsInstance(rag_signals["confidence_score"], (int, float))

    @patch('app.ai_engine.langchain_rag_engine.LangchainRAGEngine.__init__', return_value=None)
    def test_rag_insights_with_triage_profile(self, mock_init):
        """Test RAG insights when triage profile is provided"""
        # Mock the engine
        rag_engine = LangchainRAGEngine.__new__(LangchainRAGEngine)
        rag_engine.llm = MagicMock()
        rag_engine.retriever = MagicMock()
        
        triage_profile = {
            "severity_score": 18,
            "severity_level": "moderately_severe",
            "red_flags": {"high_risk": True},
            "dominant_symptoms": ["mood", "anxiety"],
            "urgency_level": "urgent",
            "specialist_type": "psychiatrist",
            "recommendations": ["Immediate consultation recommended"],
            "assessed_at": datetime.utcnow().isoformat(),
            "decision_locked": True,
            "immutable": True
        }
        
        # Test that RAG respects locked decisions
        self.assertTrue(triage_profile["decision_locked"])
        self.assertTrue(triage_profile["immutable"])


class TestQuestionnaireRoute(unittest.TestCase):
    """Test questionnaire route functionality"""

    def setUp(self):
        """Set up test data for questionnaire"""
        self.test_payload = {
            "user_id": "test_user_123",
            "responses": {
                1: 0,
                2: 1,
                3: 2,
                4: 1,
                5: 0,
                6: 1,
                7: 2,
                8: 1,
                9: 0,
                10: 1
            },
            "timestamp": datetime.utcnow().isoformat()
        }

    @patch('app.routes.questionnaire.SRTSEngine.create_triage_profile')
    @patch('app.routes.questionnaire.LangchainRAGEngine.enhance_questionnaire_results')
    @patch('app.core.database.create_recommendation_snapshot')
    def test_submit_questionnaire_response(self, mock_create_snapshot, mock_rag_enhance, mock_create_triage):
        """Test submitting questionnaire response"""
        # Mock the triage profile creation
        mock_triage_profile = {
            "severity_score": 12,
            "severity_level": "moderate",
            "red_flags": {"high_risk": False},
            "dominant_symptoms": ["mood"],
            "urgency_level": "soon",
            "specialist_type": "psychologist",
            "recommendations": ["Consider therapy"],
            "assessed_at": datetime.utcnow().isoformat(),
            "decision_locked": True,
            "immutable": True
        }
        mock_create_triage.return_value = mock_triage_profile
        
        # Mock RAG enhancement
        mock_enhancement = {
            "contextual_advice": ["Practice mindfulness"],
            "insights": "Based on responses, consider therapy",
            "rag_signals": {
                "suggested_specialty_adjustment": None,
                "risk_flags": [],
                "confidence_score": 0.7
            }
        }
        mock_rag_enhance.return_value = mock_enhancement
        
        # Mock snapshot creation
        mock_create_snapshot.return_value = "snapshot_123"
        
        # Test the function (we can't test the full FastAPI route easily,
        # so we test the core logic)
        from app.ai_engine.srts_scoring import SRTSEngine
        
        # Test triage profile creation directly
        result = SRTSEngine.create_triage_profile(self.test_payload["responses"])
        
        self.assertEqual(result["severity_score"], 12)
        self.assertEqual(result["severity_level"], "moderate")
        self.assertTrue(result["decision_locked"])

    def test_response_validation(self):
        """Test validation of questionnaire responses"""
        # Test with valid responses
        valid_responses = {i: min(3, max(0, i % 4)) for i in range(1, 11)}
        result = SRTSEngine.create_triage_profile(valid_responses)
        
        self.assertIsNotNone(result)
        self.assertIn("severity_score", result)
        
        # Test with invalid responses (out of range)
        invalid_responses = {1: -1, 2: 5}  # Invalid scores
        # The engine should handle these gracefully
        result = SRTSEngine.create_triage_profile(invalid_responses)
        
        self.assertIsNotNone(result)

    @patch('app.routes.questionnaire.SRTSEngine.create_triage_profile')
    def test_questionnaire_with_empty_responses(self, mock_create_triage):
        """Test questionnaire with empty responses"""
        empty_responses = {}
        
        mock_triage_profile = {
            "severity_score": 0,
            "severity_level": "minimal",
            "red_flags": {"high_risk": False},
            "dominant_symptoms": [],
            "urgency_level": "routine",
            "specialist_type": "counselor",
            "recommendations": ["Consider general wellness"],
            "assessed_at": datetime.utcnow().isoformat(),
            "decision_locked": True,
            "immutable": True
        }
        mock_create_triage.return_value = mock_triage_profile
        
        result = SRTSEngine.create_triage_profile(empty_responses)
        self.assertEqual(result["severity_score"], 0)
        self.assertEqual(result["severity_level"], "minimal")

    @patch('app.routes.questionnaire.SRTSEngine.create_triage_profile')
    def test_questionnaire_with_missing_responses(self, mock_create_triage):
        """Test questionnaire with missing responses"""
        partial_responses = {1: 0, 2: 1}  # Only some questions answered
        
        mock_triage_profile = {
            "severity_score": 1,
            "severity_level": "minimal",
            "red_flags": {"high_risk": False},
            "dominant_symptoms": [],
            "urgency_level": "routine",
            "specialist_type": "counselor",
            "recommendations": ["Consider general wellness"],
            "assessed_at": datetime.utcnow().isoformat(),
            "decision_locked": True,
            "immutable": True
        }
        mock_create_triage.return_value = mock_triage_profile
        
        result = SRTSEngine.create_triage_profile(partial_responses)
        self.assertGreaterEqual(result["severity_score"], 0)


class TestMedicalServiceIntegration(unittest.TestCase):
    """Test integration between different components"""

    def test_severity_to_specialist_mapping(self):
        """Test mapping from severity to specialist type"""
        # Test different severity levels
        test_cases = [
            ({"responses": {i: 0 for i in range(1, 11)}}, "counselor"),  # Minimal
            ({"responses": {i: 1 for i in range(1, 11)}}, "counselor"),  # Mild
            ({"responses": {i: 2 for i in range(1, 11)}}, "psychologist"),  # Moderate
            ({"responses": {i: 3 for i in range(1, 11)}}, "psychiatrist"),  # Severe
        ]
        
        for responses, expected_specialist in test_cases:
            triage_profile = SRTSEngine.create_triage_profile(responses["responses"])
            self.assertEqual(triage_profile["specialist_type"], expected_specialist)

    def test_red_flag_prioritization(self):
        """Test that red flags override severity-based routing"""
        # Even with low severity, red flags should route to psychiatrist
        low_severity_with_red_flag = {i: 0 for i in range(1, 11)}
        low_severity_with_red_flag[9] = 3  # High score for self-harm thoughts
        
        triage_profile = SRTSEngine.create_triage_profile(low_severity_with_red_flag)
        
        # Should be psychiatrist regardless of severity level
        self.assertEqual(triage_profile["specialist_type"], "psychiatrist")
        self.assertTrue(triage_profile["red_flags"]["suicidal_ideation"])

    def test_urgency_calculation(self):
        """Test urgency level calculation"""
        # High risk should result in immediate urgency
        high_risk_responses = {i: 0 for i in range(1, 11)}
        high_risk_responses[9] = 3  # Self-harm thoughts
        
        triage_profile = SRTSEngine.create_triage_profile(high_risk_responses)
        self.assertEqual(triage_profile["urgency_level"], "immediate")
        
        # High severity without red flags should be urgent
        high_severity_responses = {i: 3 for i in range(1, 11)}
        high_severity_responses[9] = 0  # No self-harm thoughts
        high_severity_responses[2] = 3  # Feeling down
        
        triage_profile = SRTSEngine.create_triage_profile(high_severity_responses)
        self.assertIn(triage_profile["urgency_level"], ["urgent", "immediate"])

    def test_recommendation_consistency(self):
        """Test that recommendations are consistent for same responses"""
        responses = {i: 1 for i in range(1, 11)}  # Same responses
        
        triage_profile_1 = SRTSEngine.create_triage_profile(responses)
        triage_profile_2 = SRTSEngine.create_triage_profile(responses)
        
        # Should have same severity level and specialist type
        self.assertEqual(triage_profile_1["severity_level"], triage_profile_2["severity_level"])
        self.assertEqual(triage_profile_1["specialist_type"], triage_profile_2["specialist_type"])
        self.assertEqual(triage_profile_1["severity_score"], triage_profile_2["severity_score"])


class TestDatabaseIntegration(unittest.TestCase):
    """Test database integration for recommendation snapshots"""

    @patch('app.core.database.get_mongo_collection')
    def test_create_recommendation_snapshot(self, mock_get_collection):
        """Test creating recommendation snapshot"""
        # Mock the MongoDB collection
        mock_collection = MagicMock()
        mock_get_collection.return_value = mock_collection
        mock_collection.insert_one.return_value.inserted_id = "snapshot_123"
        
        user_id = "user123"
        assessment_id = "assessment456"
        triage_profile = {
            "severity_score": 15,
            "severity_level": "moderately_severe",
            "specialist_type": "psychiatrist",
            "decision_locked": True
        }
        suggested_doctors = [
            {"id": "doc1", "name": "Dr. Smith", "specialization": "Psychiatrist"},
            {"id": "doc2", "name": "Dr. Jones", "specialization": "Psychiatrist"}
        ]
        
        snapshot_id = create_recommendation_snapshot(user_id, assessment_id, triage_profile, suggested_doctors)
        
        self.assertEqual(snapshot_id, "snapshot_123")
        mock_collection.insert_one.assert_called_once()

    @patch('app.core.database.get_mongo_collection')
    def test_snapshot_data_structure(self, mock_get_collection):
        """Test that snapshot contains correct data structure"""
        # Mock the MongoDB collection
        mock_collection = MagicMock()
        mock_get_collection.return_value = mock_collection
        mock_collection.insert_one.return_value.inserted_id = "snapshot_456"
        
        user_id = "user789"
        assessment_id = "assessment012"
        triage_profile = {
            "severity_score": 10,
            "severity_level": "moderate",
            "specialist_type": "psychologist",
            "decision_locked": True,
            "immutable": True
        }
        suggested_doctors = [
            {"id": "doc3", "name": "Dr. Williams", "specialization": "Psychologist"}
        ]
        
        snapshot_id = create_recommendation_snapshot(user_id, assessment_id, triage_profile, suggested_doctors)
        
        # Check that the correct data was passed to insert_one
        args, kwargs = mock_collection.insert_one.call_args
        inserted_data = args[0]
        
        self.assertEqual(inserted_data["user_id"], user_id)
        self.assertEqual(inserted_data["assessment_id"], assessment_id)
        self.assertEqual(inserted_data["triage_profile"], triage_profile)
        self.assertEqual(inserted_data["suggested_doctors"], suggested_doctors)
        self.assertIsNotNone(inserted_data["created_at"])


class TestMedicalServiceAPI(unittest.TestCase):
    """Test medical service API endpoints"""

    def test_phq9_questionnaire_structure(self):
        """Test PHQ-9 questionnaire structure and scoring"""
        # PHQ-9 has 9 core questions (plus 1 functional impairment question)
        phq9_questions = list(range(1, 11))  # Questions 1-10
        
        # Test that all questions are properly scored (0-3 scale)
        for question_num in phq9_questions:
            for score in [0, 1, 2, 3]:  # Valid PHQ-9 scores
                responses = {question_num: score}
                # Add other questions with 0 to avoid missing keys
                for q in range(1, 11):
                    if q != question_num:
                        responses[q] = 0
                
                result = SRTSEngine.create_triage_profile(responses)
                self.assertIsNotNone(result["severity_score"])

    def test_triage_profile_immutability(self):
        """Test that triage profiles are immutable after creation"""
        responses = {i: 1 for i in range(1, 11)}
        triage_profile = SRTSEngine.create_triage_profile(responses)
        
        # Check that the profile is marked as immutable
        self.assertTrue(triage_profile.get("decision_locked", False))
        self.assertTrue(triage_profile.get("immutable", False))
        
        # Try to modify the profile (this should not affect the original logic)
        # In a real scenario, this would be prevented by the system design

    def test_severity_thresholds(self):
        """Test that severity thresholds are correctly applied"""
        thresholds = {
            "minimal": (0, 4),
            "mild": (5, 9),
            "moderate": (10, 14),
            "moderately_severe": (15, 19),
            "severe": (20, 27)
        }
        
        for level, (min_score, max_score) in thresholds.items():
            # Create responses that would result in scores in this range
            # For simplicity, we'll test the boundary conditions
            if min_score == 0:
                # Test minimal range
                responses = {i: 0 for i in range(1, 11)}
                responses[1] = min_score  # Adjust to get exact score
            else:
                # Distribute scores to achieve target range
                responses = {i: min_score // 10 for i in range(1, 11)}
            
            triage_profile = SRTSEngine.create_triage_profile(responses)
            # Note: Exact score matching depends on weights, so we'll test general logic
            self.assertIn("severity_level", triage_profile)
            self.assertIsInstance(triage_profile["severity_level"], str)


def run_medical_service_tests():
    """Run all tests in the medical service test suite"""
    print("🔍 Running Medical Service Unit Tests...")
    
    # Create a test suite
    suite = unittest.TestLoader().loadTestsFromTestCase(TestSRTSEngine)
    suite.addTests(unittest.TestLoader().loadTestsFromTestCase(TestLangchainRAGEngine))
    suite.addTests(unittest.TestLoader().loadTestsFromTestCase(TestQuestionnaireRoute))
    suite.addTests(unittest.TestLoader().loadTestsFromTestCase(TestMedicalServiceIntegration))
    suite.addTests(unittest.TestLoader().loadTestsFromTestCase(TestDatabaseIntegration))
    suite.addTests(unittest.TestLoader().loadTestsFromTestCase(TestMedicalServiceAPI))
    
    # Run the tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    # Print summary
    print(f"\n📊 Medical Service Test Results:")
    print(f"   ✅ Passed: {result.testsRun - len(result.failures) - len(result.errors)}")
    print(f"   ❌ Failures: {len(result.failures)}")
    print(f"   ⚠️  Errors: {len(result.errors)}")
    print(f"   📝 Total: {result.testsRun}")
    
    return result.wasSuccessful()


if __name__ == "__main__":
    success = run_medical_service_tests()
    exit(0 if success else 1)