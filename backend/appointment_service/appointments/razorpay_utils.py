"""
Razorpay utility functions for appointment_service V1.

Handles Razorpay order creation and webhook signature verification.
"""
import hashlib
import hmac
import logging

import razorpay
from django.conf import settings

logger = logging.getLogger(__name__)


def get_razorpay_client():
    """
    Returns configured Razorpay client instance.
    """
    razorpay_key_id = settings.RAZORPAY_KEY_ID
    razorpay_key_secret = settings.RAZORPAY_KEY_SECRET

    if not razorpay_key_id:
        raise ValueError("Razorpay key ID not configured")
    
    if not razorpay_key_secret:
        raise ValueError("Razorpay key secret not configured")

    return razorpay.Client(auth=(razorpay_key_id, razorpay_key_secret))


def create_razorpay_order(amount_paise: int, currency: str = "INR", notes: dict = None):
    """
    Creates a Razorpay order.

    Args:
        amount_paise: Amount in paise (smallest currency unit)
        currency: Currency code (default: INR)
        notes: Optional notes dict

    Returns:
        dict: Razorpay order response with order_id
    """
    try:
        client = get_razorpay_client()

        order_data = {
            "amount": amount_paise,
            "currency": currency,
        }

        if notes:
            order_data["notes"] = notes

        order = client.order.create(data=order_data)
        logger.info(f"Created Razorpay order: {order.get('id')}")
        return order

    except Exception as exc:
        logger.error(f"Failed to create Razorpay order: {exc}")
        raise


def verify_razorpay_signature(order_id: str, payment_id: str, signature: str) -> bool:
    """
    Verifies Razorpay webhook signature.

    Args:
        order_id: Razorpay order ID
        payment_id: Razorpay payment ID
        signature: Signature from webhook

    Returns:
        bool: True if signature is valid
    """
    razorpay_secret = settings.RAZORPAY_KEY_SECRET

    if not razorpay_secret:
        logger.error("Razorpay secret not configured")
        return False

    # Create message string: order_id|payment_id
    message = f"{order_id}|{payment_id}"

    # Generate expected signature
    expected_signature = hmac.new(
        razorpay_secret.encode(),
        message.encode(),
        hashlib.sha256
    ).hexdigest()

    # Compare signatures (constant-time comparison)
    return hmac.compare_digest(expected_signature, signature)

