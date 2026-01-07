import os
import logging
import firebase_admin
from firebase_admin import credentials, messaging
from django.conf import settings

logger = logging.getLogger(__name__)

# Initialize Firebase Admin SDK
# Path to your serviceAccountKey.json
SERVICE_ACCOUNT_KEY_PATH = os.path.join(settings.BASE_DIR, 'serviceAccountKey.json')

if not firebase_admin._apps:
    try:
        if os.path.exists(SERVICE_ACCOUNT_KEY_PATH):
            cred = credentials.Certificate(SERVICE_ACCOUNT_KEY_PATH)
            firebase_admin.initialize_app(cred)
            logger.info("Firebase Admin initialized successfully.")
        else:
            logger.warning(f"Firebase Service Account Key NOT FOUND at {SERVICE_ACCOUNT_KEY_PATH}. FCM will run in SIMULATION mode.")
    except Exception as e:
        logger.error(f"Error initializing Firebase Admin: {str(e)}")

def send_fcm_notification(fcm_token, title, body, data=None):
    """
    Sends an FCM push notification using the Firebase Admin SDK.
    """
    if not fcm_token:
        logger.warning("FCM token is missing for user.")
        return False

    # Check if Firebase is initialized correctly
    if not firebase_admin._apps:
        logger.warning(f"FCM SIMULATION: [To: {fcm_token[:10]}...] | Title: {title} | Body: {body}")
        return True

    # Construct the message
    message = messaging.Message(
        notification=messaging.Notification(
            title=title,
            body=body,
        ),
        data=data or {},
        token=fcm_token,
    )

    try:
        response = messaging.send(message)
        logger.info(f"FCM: Successfully sent message: {response}")
        return True
    except Exception as e:
        logger.error(f"FCM: Error sending message: {str(e)}")
        return False
