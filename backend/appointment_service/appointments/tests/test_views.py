import datetime
import uuid
from unittest.mock import patch, MagicMock
from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient
from appointments.models import Appointment

class AppointmentViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user_id = str(uuid.uuid4())
        self.doctor_id = str(uuid.uuid4())
        self.user_token = "mock-jwt-token"
        
        # Test URLs
        self.list_create_url = "/api/appointments/"
        self.slots_url = f"/api/appointments/doctors/{self.doctor_id}/available-slots/"
        
        self.appointment = Appointment.objects.create(
            user_id=uuid.UUID(self.user_id),
            doctor_id=uuid.UUID(self.doctor_id),
            scheduled_at=timezone.now() + datetime.timedelta(days=1),
            status="pending"
        )

    @patch("appointments.authentication.requests.post")
    @patch("appointments.utils.fetch_doctor_availability_and_fee")
    def test_get_available_slots(self, mock_fetch_doctor, mock_auth_post):
        """Test fetching available slots logic"""
        # Mock Auth
        mock_auth_response = MagicMock()
        mock_auth_response.status_code = 200
        mock_auth_response.json.return_value = {
            "user_id": self.user_id,
            "role": "user"
        }
        mock_auth_post.return_value = mock_auth_response

        # Mock doctor data
        mock_fetch_doctor.return_value = {
            "available": True,
            "approved": True,
            "start_time": "09:00",
            "end_time": "11:00",
            "slot_duration": 30, # 30 mins
            "consultation_fee": 500
        }
        
        today = datetime.date.today().strftime('%Y-%m-%d')
        response = self.client.get(
            self.slots_url, 
            {'date': today},
            HTTP_AUTHORIZATION=f"Bearer {self.user_token}"
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # We can also verify content if needed, but Utils test covers logic

    @patch("appointments.authentication.requests.post")
    def test_get_appointments_list(self, mock_auth_post):
        """Test getting appointments list"""
        mock_auth_response = MagicMock()
        mock_auth_response.status_code = 200
        mock_auth_response.json.return_value = {
            "user_id": self.user_id,
            "role": "user",
            "email": "user@example.com",
            "type": "access",
            "exp": 9999999999
        }
        mock_auth_post.return_value = mock_auth_response
        
        response = self.client.get(
            "/api/appointments/",
            HTTP_AUTHORIZATION=f"Bearer {self.user_token}"
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    @patch("appointments.authentication.requests.post")
    def test_get_appointment_detail(self, mock_auth_post):
        """Test getting appointment detail"""
        mock_auth_response = MagicMock()
        mock_auth_response.status_code = 200
        mock_auth_response.json.return_value = {
            "user_id": self.user_id,
            "role": "user",
            "email": "user@example.com",
            "type": "access",
            "exp": 9999999999
        }
        mock_auth_post.return_value = mock_auth_response
        
        response = self.client.get(
            f"/api/appointments/{self.appointment.id}/",
            HTTP_AUTHORIZATION=f"Bearer {self.user_token}"
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    @patch("appointments.authentication.requests.post")
    def test_cancel_appointment_endpoint(self, mock_auth_post):
        """Test cancel appointment endpoint"""
        mock_auth_response = MagicMock()
        mock_auth_response.status_code = 200
        mock_auth_response.json.return_value = {
            "user_id": self.user_id,
            "role": "user",
            "email": "user@example.com",
            "type": "access",
            "exp": 9999999999
        }
        mock_auth_post.return_value = mock_auth_response
        
        response = self.client.post(
            f"/api/appointments/{self.appointment.id}/cancel/",
            HTTP_AUTHORIZATION=f"Bearer {self.user_token}"
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Refresh from DB to check status
        self.appointment.refresh_from_db()
        self.assertEqual(self.appointment.status, "cancelled")


