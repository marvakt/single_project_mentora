import datetime
import uuid
from decimal import Decimal
from unittest.mock import patch
from django.test import TestCase
from django.utils import timezone
from appointments.models import Appointment, Payment

class RazorpayTests(TestCase):
    def setUp(self):
        self.user_id = str(uuid.uuid4())
        self.doctor_id = str(uuid.uuid4())
        self.appointment = Appointment.objects.create(
            user_id=uuid.UUID(self.user_id),
            doctor_id=uuid.UUID(self.doctor_id),
            scheduled_at=timezone.now() + datetime.timedelta(days=1),
            status="pending"
        )
    
    @patch("appointments.utils.fetch_doctor_availability_and_fee")
    @patch("appointments.razorpay_utils.create_razorpay_order")
    def test_payment_order_creation(self, mock_razorpay, mock_fetch_doctor):
        """Test payment order creation"""
        mock_fetch_doctor.return_value = {"consultation_fee": 1000}
        mock_razorpay.return_value = {"id": "order_123"}
        
        from appointments.utils import create_payment_order
        
        order_id, amount, currency = create_payment_order(self.appointment, self.user_id)
        
        self.assertEqual(order_id, "order_123")
        self.assertEqual(amount, Decimal('1000'))
        
        # Verify Appointment auto-confirmed (as per logic in utils.py lines 743-745)
        self.appointment.refresh_from_db()
        self.assertEqual(self.appointment.status, "confirmed")

    @patch("appointments.razorpay_utils.verify_razorpay_signature")
    def test_payment_verification(self, mock_verify):
        """Test payment verification"""
        mock_verify.return_value = True
        
        payment = Payment.objects.create(
            appointment=self.appointment,
            amount=Decimal('1000.00'),
            currency='INR',
            status='created',
            razorpay_order_id='order_123',
            razorpay_payment_id='pay_123',
            razorpay_signature='signature_123'
        )
        
        from appointments.razorpay_utils import verify_razorpay_signature
        
        result = verify_razorpay_signature(
            order_id='order_123',
            payment_id='pay_123',
            signature='signature_123'
        )
        
        self.assertTrue(result)

    @patch("appointments.utils.fetch_doctor_availability_and_fee")
    @patch("appointments.razorpay_utils.create_razorpay_order")
    def test_payment_order_creation_with_different_amounts(self, mock_create_order, mock_fetch_doctor):
        """Test payment order creation with different amounts"""
        mock_fetch_doctor.return_value = {"consultation_fee": 1500}
        mock_create_order.return_value = {"id": "order_456", "amount": 150000}
        
        from appointments.utils import create_payment_order
        
        order_id, amount, currency = create_payment_order(self.appointment, self.user_id)
        
        self.assertEqual(order_id, "order_456")
        self.assertEqual(amount, Decimal('1500.00'))
