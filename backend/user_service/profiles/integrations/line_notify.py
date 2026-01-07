import requests
import logging

logger = logging.getLogger(__name__)

def send_line_notification(token: str, message: str) -> bool:
    """
    Send a notification via LINE Notify API.
    
    Args:
        token (str): The LINE Notify personalization token.
        message (str): The message to send.
        
    Returns:
        bool: True if sent successfully, False otherwise.
    """
    if not token:
        logger.warning("LINE Notify token is missing.")
        return False
        
    url = "https://notify-api.line.me/api/notify"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/x-www-form-urlencoded"
    }
    payload = {"message": message}
    
    try:
        response = requests.post(url, headers=headers, data=payload, timeout=10)
        response.raise_for_status()
        logger.info("LINE notification sent successfully.")
        return True
    except requests.exceptions.RequestException as e:
        logger.error(f"Failed to send LINE notification: {str(e)}")
        return False
