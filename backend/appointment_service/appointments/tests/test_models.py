import datetime
import uuid
from decimal import Decimal
from django.test import TestCase
from django.utils import timezone
from django.core.exceptions import ValidationError
from appointments.models import Appointment, Payment

class AppointmentModelTests(TestCase):
    def setUp(self):
        self.user_id = str(uuid.uuid4())
        self.doctor_id = str(uuid.uuid4())

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

class PaymentModelTests(TestCase):
    def setUp(self):
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
            # payment_method is likely not a field, checking models.py -> it's NOT a field.
            # Checking models.py again.  fields are: appointment, amount, currency, razorpay_order_id, razorpay_payment_id, razorpay_signature, status, created_at, updated_at, refund_id, refund_amount.
            # payment_method is NOT in models.py line 184.
            status='created',
            razorpay_order_id='order_123'
        )
        
        self.assertIsNotNone(payment.id)
        self.assertEqual(payment.amount, Decimal('1000.00'))
        self.assertEqual(payment.status, 'created')
        self.assertEqual(payment.appointment, self.appointment)

    def test_payment_status_transitions(self):
        """Test payment status transitions"""
        payment = Payment.objects.create(
            appointment=self.appointment,
            amount=Decimal('1000.00'),
            currency='INR',
            status='created',
            razorpay_order_id='order_123'
        )
        
        # Update payment status
        payment.status = 'paid'
        payment.save()
        self.assertEqual(payment.status, 'paid')


