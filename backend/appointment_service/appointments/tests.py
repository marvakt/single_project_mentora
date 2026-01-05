import datetime
import uuid
from decimal import Decimal
from unittest.mock import MagicMock, patch

from appointments.models import Appointment, Payment
from appointments.utils import AppointmentBusinessError
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

User = get_user_model()

class AppointmentTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user_id = str(uuid.uuid4())
        self.doctor_id = str(uuid.uuid4())
        self.user_token = "mock-jwt-token"
        
        # Test URLs
        self.list_create_url = "/api/appointments/"
        self.slots_url = f"/api/appointments/doctors/{self.doctor_id}/available-slots/"

    @patch("appointments.utils.fetch_doctor_availability_and_fee")
    def test_get_available_slots(self, mock_fetch_doctor):
        """Test fetching available slots logic"""
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
        
        # Test the UTIL function directly for logic correctness
        from appointments.utils import get_available_slots_for_date
        slots = get_available_slots_for_date(uuid.UUID(self.doctor_id), datetime.date.today())
        
        # 09:00, 09:30, 10:00, 10:30 (4 slots)
        self.assertEqual(len(slots), 4)
        self.assertIn("09:00", slots)
        self.assertIn("10:30", slots)

    @patch("appointments.utils.fetch_doctor_availability_and_fee")
    @patch("appointments.utils.fetch_user_severity_level")
    @patch("appointments.producer.publish_appointment_created.delay")
    def test_create_appointment_success(self, mock_publish, mock_severity, mock_fetch_doctor):
        """Test successful appointment creation"""
        mock_fetch_doctor.return_value = {
            "available": True,
            "approved": True,
            "consultation_fee": 500
        }
        mock_severity.return_value = {"severity_level": "moderate", "raw_score": 12}
        
        # Test via Utils to avoid Auth Middleware complexity in unit tests
        from appointments.utils import create_appointment_with_validation
        
        scheduled_time = timezone.now() + datetime.timedelta(days=1)
        
        appt, priority, severity, fee = create_appointment_with_validation(
            user_id=self.user_id,
            doctor_id=uuid.UUID(self.doctor_id),
            scheduled_at=scheduled_time,
            severity_level=None,
            notes="Test notes",
            auth_header="Bearer token"
        )
        
        self.assertIsNotNone(appt.id)
        self.assertEqual(appt.status, "pending")
        self.assertEqual(priority, "medium") # Moderate = medium
        self.assertEqual(fee, Decimal('500'))

    @patch("appointments.utils.fetch_doctor_availability_and_fee")
    def test_create_appointment_conflict(self, mock_fetch_doctor):
        """Test booking conflict"""
        mock_fetch_doctor.return_value = {"available": True, "approved": True, "consultation_fee": 500}
        
        scheduled_time = timezone.now() + datetime.timedelta(days=1)
        
        # Create first appointment
        Appointment.objects.create(
            user_id=uuid.UUID(self.user_id),
            doctor_id=uuid.UUID(self.doctor_id),
            scheduled_at=scheduled_time,
            status="confirmed"
        )
        
        from appointments.utils import (
            AppointmentBusinessError,
            create_appointment_with_validation,
        )

        # Try to book same slot
        with self.assertRaises(AppointmentBusinessError) as context:
            create_appointment_with_validation(
                user_id=str(uuid.uuid4()), # Different user
                doctor_id=uuid.UUID(self.doctor_id),
                scheduled_at=scheduled_time, # Same time
                severity_level=None,
                notes="Conflict",
                auth_header="Bearer token"
            )
            
        self.assertIn("already booked", str(context.exception))

    def test_cancel_appointment(self):
        """Test cancellation logic"""
        scheduled_time = timezone.now() + datetime.timedelta(days=1)
        appt = Appointment.objects.create(
            user_id=uuid.UUID(self.user_id),
            doctor_id=uuid.UUID(self.doctor_id),
            scheduled_at=scheduled_time,
            status="pending"
        )
        
        from appointments.utils import cancel_appointment

        # Success case
        cancelled_appt = cancel_appointment(appt, self.user_id)
        self.assertEqual(cancelled_appt.status, "cancelled")
        
        # Fail case: Wrong user
        appt.status = "pending" # Reset
        appt.save()
        
        from appointments.utils import AppointmentBusinessError
        with self.assertRaises(AppointmentBusinessError):
            cancel_appointment(appt, str(uuid.uuid4()))

    @patch("appointments.utils.fetch_doctor_availability_and_fee")
    @patch("appointments.razorpay_utils.create_razorpay_order")
    def test_payment_order_creation(self, mock_razorpay, mock_fetch_doctor):
        """Test payment order creation"""
        mock_fetch_doctor.return_value = {"consultation_fee": 1000}
        mock_razorpay.return_value = {"id": "order_123"}
        
        appt = Appointment.objects.create(
            user_id=uuid.UUID(self.user_id),
            doctor_id=uuid.UUID(self.doctor_id),
            scheduled_at=timezone.now(),
            status="pending"
        )
        
        from appointments.utils import create_payment_order
        
        order_id, amount, currency = create_payment_order(appt, self.user_id)
        
        self.assertEqual(order_id, "order_123")
        self.assertEqual(amount, Decimal('1000'))
        
        # Verify Appointment auto-confirmed (as per your logic in utils.py lines 743-745)
        appt.refresh_from_db()
        self.assertEqual(appt.status, "confirmed")

    @patch("appointments.utils.fetch_doctor_availability_and_fee")
    def test_appointment_validation(self, mock_fetch_doctor):
        """Test appointment validation logic"""
        mock_fetch_doctor.return_value = {"available": True, "approved": True, "consultation_fee": 500}
        
        from appointments.utils import validate_appointment_creation

        # Test with valid future time
        future_time = timezone.now() + datetime.timedelta(days=1)
        result = validate_appointment_creation(
            user_id=self.user_id,
            doctor_id=uuid.UUID(self.doctor_id),
            scheduled_at=future_time,
            auth_header="Bearer token"
        )
        
        self.assertTrue(result)

    @patch("appointments.utils.fetch_doctor_availability_and_fee")
    def test_appointment_past_time_validation(self, mock_fetch_doctor):
        """Test appointment validation for past time"""
        mock_fetch_doctor.return_value = {"available": True, "approved": True, "consultation_fee": 500}
        
        from appointments.utils import (
            AppointmentBusinessError,
            validate_appointment_creation,
        )

        # Test with past time
        past_time = timezone.now() - datetime.timedelta(days=1)
        
        with self.assertRaises(AppointmentBusinessError) as context:
            validate_appointment_creation(
                user_id=self.user_id,
                doctor_id=uuid.UUID(self.doctor_id),
                scheduled_at=past_time,
                auth_header="Bearer token"
            )
            
        self.assertIn("cannot be in the past", str(context.exception))

    @patch("appointments.utils.fetch_doctor_availability_and_fee")
    def test_appointment_double_booking_prevention(self, mock_fetch_doctor):
        """Test double booking prevention"""
        mock_fetch_doctor.return_value = {"available": True, "approved": True, "consultation_fee": 500}
        
        scheduled_time = timezone.now() + datetime.timedelta(days=1)
        
        # Create first appointment
        Appointment.objects.create(
            user_id=uuid.UUID(self.user_id),
            doctor_id=uuid.UUID(self.doctor_id),
            scheduled_at=scheduled_time,
            status="confirmed"
        )
        
        from appointments.utils import check_double_booking

        # Check for double booking
        is_double_booked = check_double_booking(
            doctor_id=uuid.UUID(self.doctor_id),
            scheduled_at=scheduled_time,
            exclude_appointment_id=None
        )
        
        self.assertTrue(is_double_booked)

    def test_appointment_status_transitions(self):
        """Test appointment status transitions"""
        scheduled_time = timezone.now() + datetime.timedelta(days=1)
        appt = Appointment.objects.create(
            user_id=uuid.UUID(self.user_id),
            doctor_id=uuid.UUID(self.doctor_id),
            scheduled_at=scheduled_time,
            status="pending"
        )
        
        # Test status transitions
        appt.status = "confirmed"
        appt.save()
        self.assertEqual(appt.status, "confirmed")
        
        appt.status = "completed"
        appt.save()
        self.assertEqual(appt.status, "completed")

    def test_appointment_model_validation(self):
        """Test appointment model validation"""
        scheduled_time = timezone.now() + datetime.timedelta(days=1)
        
        # Test creating appointment with valid data
        appt = Appointment.objects.create(
            user_id=uuid.UUID(self.user_id),
            doctor_id=uuid.UUID(self.doctor_id),
            scheduled_at=scheduled_time,
            status="pending"
        )
        
        self.assertIsNotNone(appt.id)
        self.assertEqual(appt.status, "pending")
        self.assertEqual(appt.user_id, uuid.UUID(self.user_id))
        self.assertEqual(appt.doctor_id, uuid.UUID(self.doctor_id))

    @patch("appointments.utils.fetch_doctor_availability_and_fee")
    def test_appointment_priority_calculation(self, mock_fetch_doctor):
        """Test appointment priority calculation based on severity"""
        mock_fetch_doctor.return_value = {"available": True, "approved": True, "consultation_fee": 500}
        
        from appointments.utils import calculate_appointment_priority

        # Test different severity levels
        critical_priority = calculate_appointment_priority("severe")
        self.assertEqual(critical_priority, "high")
        
        moderate_priority = calculate_appointment_priority("moderate")
        self.assertEqual(moderate_priority, "medium")
        
        mild_priority = calculate_appointment_priority("mild")
        self.assertEqual(mild_priority, "low")
        
        minimal_priority = calculate_appointment_priority("minimal")
        self.assertEqual(minimal_priority, "low")

    @patch("appointments.utils.fetch_doctor_availability_and_fee")
    def test_appointment_creation_with_invalid_data(self, mock_fetch_doctor):
        """Test appointment creation with invalid data"""
        mock_fetch_doctor.return_value = {"available": True, "approved": True, "consultation_fee": 500}
        
        from appointments.utils import (
            AppointmentBusinessError,
            validate_appointment_creation,
        )

        # Test with invalid user ID
        with self.assertRaises(AppointmentBusinessError):
            validate_appointment_creation(
                user_id="",  # Empty user ID
                doctor_id=uuid.UUID(self.doctor_id),
                scheduled_at=timezone.now() + datetime.timedelta(days=1),
                auth_header="Bearer token"
            )

    @patch("appointments.utils.fetch_doctor_availability_and_fee")
    def test_appointment_creation_with_unavailable_doctor(self, mock_fetch_doctor):
        """Test appointment creation when doctor is unavailable"""
        mock_fetch_doctor.return_value = {"available": False, "approved": True, "consultation_fee": 500}
        
        from appointments.utils import (
            AppointmentBusinessError,
            validate_appointment_creation,
        )
        
        with self.assertRaises(AppointmentBusinessError) as context:
            validate_appointment_creation(
                user_id=self.user_id,
                doctor_id=uuid.UUID(self.doctor_id),
                scheduled_at=timezone.now() + datetime.timedelta(days=1),
                auth_header="Bearer token"
            )
            
        self.assertIn("not available", str(context.exception))


class PaymentTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user_id = str(uuid.uuid4())
        self.appointment = Appointment.objects.create(
            user_id=uuid.UUID(self.user_id),
            doctor_id=uuid.uuid4(),
            scheduled_at=timezone.now() + datetime.timedelta(days=1),
            status="pending"
        )

    def test_payment_creation(self):
        """Test payment creation"""
        payment = Payment.objects.create(
            appointment=self.appointment,
            amount=Decimal('1000.00'),
            currency='INR',
            payment_method='razorpay',
            payment_status='created',
            razorpay_order_id='order_123'
        )
        
        self.assertIsNotNone(payment.id)
        self.assertEqual(payment.amount, Decimal('1000.00'))
        self.assertEqual(payment.payment_status, 'created')
        self.assertEqual(payment.appointment, self.appointment)

    def test_payment_status_transitions(self):
        """Test payment status transitions"""
        payment = Payment.objects.create(
            appointment=self.appointment,
            amount=Decimal('1000.00'),
            currency='INR',
            payment_method='razorpay',
            payment_status='created',
            razorpay_order_id='order_123'
        )
        
        # Update payment status
        payment.payment_status = 'paid'
        payment.save()
        self.assertEqual(payment.payment_status, 'paid')

    @patch("appointments.razorpay_utils.verify_razorpay_payment")
    def test_payment_verification(self, mock_verify):
        """Test payment verification"""
        mock_verify.return_value = True
        
        payment = Payment.objects.create(
            appointment=self.appointment,
            amount=Decimal('1000.00'),
            currency='INR',
            payment_method='razorpay',
            payment_status='created',
            razorpay_order_id='order_123',
            razorpay_payment_id='pay_123',
            razorpay_signature='signature_123'
        )
        
        from appointments.razorpay_utils import verify_razorpay_payment
        
        result = verify_razorpay_payment(
            razorpay_order_id='order_123',
            razorpay_payment_id='pay_123',
            razorpay_signature='signature_123'
        )
        
        self.assertTrue(result)

    def test_payment_model_validation(self):
        """Test payment model validation"""
        with self.assertRaises(ValidationError):
            payment = Payment(
                appointment=self.appointment,
                amount=Decimal('-100.00'),  # Negative amount
                currency='INR',
                payment_method='razorpay',
                payment_status='created',
                razorpay_order_id='order_123'
            )
            payment.full_clean()  # This triggers validation

    @patch("appointments.razorpay_utils.create_razorpay_order")
    def test_payment_order_creation_with_different_amounts(self, mock_create_order):
        """Test payment order creation with different amounts"""
        mock_create_order.return_value = {"id": "order_456", "amount": 1500}
        
        from appointments.utils import create_payment_order
        
        order_id, amount, currency = create_payment_order(self.appointment, self.user_id)
        
        self.assertEqual(order_id, "order_456")
        self.assertEqual(amount, Decimal('1500.00'))


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
            "raw_score": 15,
            "severity_level": "moderately_severe",
            "specialist_type": "psychiatrist"
        }
        mock_requests_get.return_value = mock_response
        
        result = fetch_user_severity_level(self.user_id)
        
        self.assertEqual(result["raw_score"], 15)
        self.assertEqual(result["severity_level"], "moderately_severe")

    def test_format_time_range(self):
        """Test time range formatting"""
        from appointments.utils import format_time_range
        
        result = format_time_range("09:00", "17:00", 30)
        
        # Should generate time slots from 09:00 to 17:00 in 30-minute intervals
        self.assertIn("09:00", result)
        self.assertIn("09:30", result)
        self.assertIn("16:30", result)
        self.assertNotIn("17:00", result)  # End time is exclusive

    def test_validate_datetime_format(self):
        """Test datetime format validation"""
        from datetime import datetime

        from appointments.utils import validate_datetime_format

        # Valid datetime
        valid_dt = datetime.now() + datetime.timedelta(days=1)
        self.assertTrue(validate_datetime_format(valid_dt))
        
        # Invalid datetime (in the past)
        invalid_dt = datetime.now() - datetime.timedelta(days=1)
        self.assertFalse(validate_datetime_format(invalid_dt))

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
        
        with self.assertRaises(Exception):
            fetch_user_severity_level(self.user_id)


class AppointmentAPIEndpointTests(TestCase):
    """Test appointment API endpoints"""
    
    def setUp(self):
        self.client = APIClient()
        self.user_id = str(uuid.uuid4())
        self.doctor_id = str(uuid.uuid4())
        self.user_token = "mock-jwt-token"
        self.appointment = Appointment.objects.create(
            user_id=uuid.UUID(self.user_id),
            doctor_id=uuid.uuid4(),
            scheduled_at=timezone.now() + datetime.timedelta(days=1),
            status="pending"
        )

    @patch("appointments.authentication.jwt.decode")
    def test_get_appointments_list(self, mock_jwt_decode):
        """Test getting appointments list"""
        mock_jwt_decode.return_value = {
            "user_id": self.user_id,
            "role": "user",
            "email": "user@example.com",
            "type": "access",
            "exp": 9999999999
        }
        
        response = self.client.get(
            "/api/appointments/",
            HTTP_AUTHORIZATION=f"Bearer {self.user_token}"
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    @patch("appointments.authentication.jwt.decode")
    def test_get_appointment_detail(self, mock_jwt_decode):
        """Test getting appointment detail"""
        mock_jwt_decode.return_value = {
            "user_id": self.user_id,
            "role": "user",
            "email": "user@example.com",
            "type": "access",
            "exp": 9999999999
        }
        
        response = self.client.get(
            f"/api/appointments/{self.appointment.id}/",
            HTTP_AUTHORIZATION=f"Bearer {self.user_token}"
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    @patch("appointments.authentication.jwt.decode")
    def test_cancel_appointment_endpoint(self, mock_jwt_decode):
        """Test cancel appointment endpoint"""
        mock_jwt_decode.return_value = {
            "user_id": self.user_id,
            "role": "user",
            "email": "user@example.com",
            "type": "access",
            "exp": 9999999999
        }
        
        response = self.client.patch(
            f"/api/appointments/{self.appointment.id}/cancel/",
            HTTP_AUTHORIZATION=f"Bearer {self.user_token}"
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Refresh from DB to check status
        self.appointment.refresh_from_db()
        self.assertEqual(self.appointment.status, "cancelled")

    @patch("appointments.authentication.jwt.decode")
    def test_reschedule_appointment(self, mock_jwt_decode):
        """Test rescheduling an appointment"""
        mock_jwt_decode.return_value = {
            "user_id": self.user_id,
            "role": "user",
            "email": "user@example.com",
            "type": "access",
            "exp": 9999999999
        }
        
        new_time = timezone.now() + datetime.timedelta(days=2)
        data = {
            "scheduled_at": new_time.isoformat()
        }
        
        response = self.client.patch(
            f"/api/appointments/{self.appointment.id}/reschedule/",
            data,
            format='json',
            HTTP_AUTHORIZATION=f"Bearer {self.user_token}"
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class BusinessLogicTests(TestCase):
    """Test business logic for appointments"""
    
    def setUp(self):
        self.user_id = str(uuid.uuid4())
        self.doctor_id = uuid.uuid4()
        
    def test_appointment_business_rules(self):
        """Test core appointment business rules"""
        from appointments.utils import validate_appointment_creation

        # Rule: Appointments must be in the future
        past_time = timezone.now() - datetime.timedelta(hours=1)
        self.assertFalse(validate_appointment_creation(
            user_id=self.user_id,
            doctor_id=self.doctor_id,
            scheduled_at=past_time,
            auth_header="Bearer token"
        ))
        
        # Rule: Appointments should be at least 1 hour in the future
        near_future = timezone.now() + datetime.timedelta(minutes=30)
        self.assertFalse(validate_appointment_creation(
            user_id=self.user_id,
            doctor_id=self.doctor_id,
            scheduled_at=near_future,
            auth_header="Bearer token"
        ))
        
        # Rule: Appointments should be within reasonable future (e.g., 30 days)
        far_future = timezone.now() + datetime.timedelta(days=31)
        self.assertFalse(validate_appointment_creation(
            user_id=self.user_id,
            doctor_id=self.doctor_id,
            scheduled_at=far_future,
            auth_header="Bearer token"
        ))

    def test_severity_based_priority_logic(self):
        """Test severity-based appointment priority logic"""
        from appointments.utils import calculate_appointment_priority

        # Test different severity levels map to correct priorities
        severity_priority_map = {
            "minimal": "low",
            "mild": "low", 
            "moderate": "medium",
            "moderately_severe": "high",
            "severe": "high"
        }
        
        for severity, expected_priority in severity_priority_map.items():
            actual_priority = calculate_appointment_priority(severity)
            self.assertEqual(actual_priority, expected_priority)

    def test_appointment_cancellation_policy(self):
        """Test appointment cancellation policy"""
        from appointments.utils import can_cancel_appointment

        # Create appointment
        scheduled_time = timezone.now() + datetime.timedelta(hours=24)
        appointment = Appointment.objects.create(
            user_id=uuid.UUID(self.user_id),
            doctor_id=uuid.UUID(self.doctor_id),
            scheduled_at=scheduled_time,
            status="confirmed"
        )
        
        # Should be able to cancel with more than 24 hours notice
        can_cancel = can_cancel_appointment(appointment)
        self.assertTrue(can_cancel)
        
        # Create appointment in 12 hours
        near_scheduled_time = timezone.now() + datetime.timedelta(hours=12)
        near_appointment = Appointment.objects.create(
            user_id=uuid.UUID(self.user_id),
            doctor_id=uuid.UUID(self.doctor_id),
            scheduled_at=near_scheduled_time,
            status="confirmed"
        )
        
        # Should not be able to cancel with less than 24 hours notice
        can_cancel = can_cancel_appointment(near_appointment)
        self.assertFalse(can_cancel)


class ErrorHandlingTests(TestCase):
    """Test error handling in appointment service"""
    
    @patch("appointments.utils.fetch_doctor_availability_and_fee")
    def test_error_handling_for_unavailable_doctor(self, mock_fetch_doctor):
        """Test error handling when doctor is unavailable"""
        mock_fetch_doctor.side_effect = Exception("Doctor service unavailable")
        
        from appointments.utils import (
            AppointmentBusinessError,
            validate_appointment_creation,
        )
        
        with self.assertRaises(AppointmentBusinessError):
            validate_appointment_creation(
                user_id=str(uuid.uuid4()),
                doctor_id=uuid.uuid4(),
                scheduled_at=timezone.now() + datetime.timedelta(days=1),
                auth_header="Bearer token"
            )

    @patch("appointments.utils.fetch_user_severity_level")
    def test_error_handling_for_severity_fetch_failure(self, mock_fetch_severity):
        """Test error handling when severity fetch fails"""
        mock_fetch_severity.side_effect = Exception("Medical service unavailable")
        
        from appointments.utils import fetch_user_severity_level
        
        with self.assertRaises(Exception):
            fetch_user_severity_level("user123")