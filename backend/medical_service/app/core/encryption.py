"""
app/core/encryption.py - Field-Level Encryption for Medical Data
Healthcare-grade encryption for sensitive patient information
"""

from cryptography.fernet import Fernet
from app.core.config import settings
import base64
import hashlib
import logging

logger = logging.getLogger(__name__)


class FieldEncryption:
    """Field-level encryption for sensitive medical data"""
    
    def __init__(self):
        """Initialize encryption with key from settings"""
        # Derive a proper 32-byte key from the encryption key
        key = hashlib.sha256(settings.ENCRYPTION_KEY.encode()).digest()
        self.cipher = Fernet(base64.urlsafe_b64encode(key))
    
    def encrypt(self, data: str) -> str:
        """
        Encrypt a string
        
        Args:
            data: Plain text string to encrypt
            
        Returns:
            Encrypted string (base64 encoded)
        """
        if not data:
            return data
        
        try:
            encrypted = self.cipher.encrypt(data.encode())
            return encrypted.decode()
        except Exception as e:
            logger.error(f"Encryption failed: {e}")
            raise
    
    def decrypt(self, encrypted_data: str) -> str:
        """
        Decrypt a string
        
        Args:
            encrypted_data: Encrypted string (base64 encoded)
            
        Returns:
            Decrypted plain text string
        """
        if not encrypted_data:
            return encrypted_data
        
        try:
            decrypted = self.cipher.decrypt(encrypted_data.encode())
            return decrypted.decode()
        except Exception as e:
            logger.error(f"Decryption failed: {e}")
            raise
    
    def encrypt_dict(self, data: dict, fields_to_encrypt: list) -> dict:
        """
        Encrypt specific fields in a dictionary
        
        Args:
            data: Dictionary containing data
            fields_to_encrypt: List of field names to encrypt
            
        Returns:
            Dictionary with encrypted fields
        """
        encrypted_data = data.copy()
        
        for field in fields_to_encrypt:
            if field in encrypted_data and encrypted_data[field]:
                if isinstance(encrypted_data[field], str):
                    encrypted_data[field] = self.encrypt(encrypted_data[field])
                elif isinstance(encrypted_data[field], (list, dict)):
                    # Convert to string, encrypt, then we'll decrypt back when needed
                    import json
                    encrypted_data[field] = self.encrypt(json.dumps(encrypted_data[field]))
        
        return encrypted_data
    
    def decrypt_dict(self, data: dict, fields_to_decrypt: list) -> dict:
        """
        Decrypt specific fields in a dictionary
        
        Args:
            data: Dictionary containing encrypted data
            fields_to_decrypt: List of field names to decrypt
            
        Returns:
            Dictionary with decrypted fields
        """
        decrypted_data = data.copy()
        
        for field in fields_to_decrypt:
            if field in decrypted_data and decrypted_data[field]:
                try:
                    decrypted_data[field] = self.decrypt(decrypted_data[field])
                except Exception:
                    # If decryption fails, might be a JSON object
                    try:
                        import json
                        decrypted_str = self.decrypt(decrypted_data[field])
                        decrypted_data[field] = json.loads(decrypted_str)
                    except Exception:
                        pass
        
        return decrypted_data


# Global encryption instance
encryption = FieldEncryption()


# Fields that should be encrypted in each collection
ENCRYPTED_FIELDS = {
    "severity_logs": ["symptoms", "notes"],
    "mood_logs": ["notes", "triggers"],
    "symptoms": ["description", "notes"],
    "chat_messages": ["message"],
    "treatment_plans": ["plan_details", "goals", "recommendations"],
    "session_notes": ["notes", "diagnosis", "recommendations", "prescription"]
}