import datetime
import uuid
from unittest.mock import MagicMock, patch
from django.test import TestCase

class UtilsTests(TestCase):
    """Test utility functions"""
    
    def setUp(self):
        self.user_id = str(uuid.uuid4())
        self.doctor_id = uuid.uuid4()
        
    @patch('appointments.utils.requests.get')
    def test_fetch_doctor_availability_and_fee(self, mock_requests_get):
        """Test fetching doctor availability and fee"""
        from appointments.utils import fetch_doctor_availability_and_fee

        # Mock the response from user service
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "available": True,
            "approved": True,
            "start_time": "09:00",
            "end_time": "17:00",
            "slot_duration": 30,
            "consultation_fee": 800
        }
        mock_requests_get.return_value = mock_response
        
        result = fetch_doctor_availability_and_fee(self.doctor_id)
        
        self.assertTrue(result["available"])
        self.assertTrue(result["approved"])
        self.assertEqual(result["consultation_fee"], 800)

    @patch('appointments.utils.requests.get')
    def test_fetch_user_severity_level(self, mock_requests_get):
        """Test fetching user severity level"""
        from appointments.utils import fetch_user_severity_level

        # Mock the response from medical service
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "score": 15,
            "severity_level": "moderately_severe",
            "specialist_type": "psychiatrist"
        }
        mock_requests_get.return_value = mock_response
        
        result = fetch_user_severity_level(self.user_id, "Bearer token")
        
        self.assertEqual(result["raw_score"], 15)
        self.assertEqual(result["severity_level"], "moderately_severe")



    @patch('appointments.utils.requests.get')
    def test_fetch_doctor_availability_failure(self, mock_requests_get):
        """Test fetching doctor availability when request fails"""
        from appointments.utils import fetch_doctor_availability_and_fee

        # Mock a failed response
        mock_response = MagicMock()
        mock_response.status_code = 404
        mock_requests_get.return_value = mock_response
        
        with self.assertRaises(Exception):
            fetch_doctor_availability_and_fee(self.doctor_id)

    @patch('appointments.utils.requests.get')
    def test_fetch_user_severity_failure(self, mock_requests_get):
        """Test fetching user severity when request fails"""
        from appointments.utils import fetch_user_severity_level

        # Mock a failed response
        mock_response = MagicMock()
        mock_response.status_code = 500
        mock_requests_get.return_value = mock_response
        
        result = fetch_user_severity_level(self.user_id, "Bearer token")
        self.assertIsNone(result)

    def test_get_available_slots_logic(self):
        """Test logic for get_available_slots_for_date (extracted from test_get_available_slots)"""
        import uuid
        from appointments.utils import get_available_slots_for_date
        
        # We need to mock the external call inside the util, so we use patch context manager here or update the test
        # But wait, original test used mock_fetch_doctor on the test method.
        # Since this is a unit test for logic, we should patch fetch_doctor_availability_and_fee
        
        with patch("appointments.utils.fetch_doctor_availability_and_fee") as mock_fetch:
            mock_fetch.return_value = {
                "available": True,
                "approved": True,
                "start_time": "09:00",
                "end_time": "11:00",
                "slot_duration": 30, 
                "consultation_fee": 500
            }
            
            slots = get_available_slots_for_date(uuid.uuid4(), datetime.date.today())
            self.assertEqual(len(slots), 4)
            self.assertIn("09:00", slots)
            self.assertIn("10:30", slots)
