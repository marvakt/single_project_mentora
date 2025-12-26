"""
app/core/encryption.py - Field-level encryption for sensitive data
"""

import base64
import os
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import json
from typing import Dict, Any, Union


class FieldEncryption:
    def __init__(self, encryption_key: str = None):
        """
        Initialize field encryption with a key.
        
        Args:
            encryption_key: Base64-encoded 32-byte key, or will generate one if not provided
        """
        if encryption_key:
            # Use provided key
            self.key = encryption_key.encode() if isinstance(encryption_key, str) else encryption_key
        else:
            # Generate a default key (in production, this should come from environment)
            self.key = Fernet.generate_key()
        
        self.cipher = Fernet(self.key)
    
    def encrypt(self, data: str) -> str:
        """Encrypt a string value"""
        if data is None:
            return None
        encrypted_data = self.cipher.encrypt(data.encode())
        return base64.b64encode(encrypted_data).decode()
    
    def decrypt(self, encrypted_data: str) -> str:
        """Decrypt an encrypted string value"""
        if encrypted_data is None:
            return None
        encrypted_bytes = base64.b64decode(encrypted_data.encode())
        decrypted_bytes = self.cipher.decrypt(encrypted_bytes)
        return decrypted_bytes.decode()
    
    def encrypt_dict(self, data: Dict[str, Any], fields_to_encrypt: list) -> Dict[str, Any]:
        """
        Encrypt specific fields in a dictionary
        
        Args:
            data: Dictionary to encrypt
            fields_to_encrypt: List of field names to encrypt
            
        Returns:
            Dictionary with specified fields encrypted
        """
        encrypted_data = data.copy()
        
        for field in fields_to_encrypt:
            if field in encrypted_data and encrypted_data[field] is not None:
                # Handle nested fields specified as 'parent.child'
                if '.' in field:
                    parent, child = field.split('.', 1)
                    if parent in encrypted_data and isinstance(encrypted_data[parent], dict):
                        if child in encrypted_data[parent]:
                            encrypted_data[parent][child] = self.encrypt(str(encrypted_data[parent][child]))
                else:
                    encrypted_data[field] = self.encrypt(str(encrypted_data[field]))
        
        return encrypted_data
    
    def decrypt_dict(self, data: Dict[str, Any], fields_to_decrypt: list) -> Dict[str, Any]:
        """
        Decrypt specific fields in a dictionary
        
        Args:
            data: Dictionary with encrypted fields
            fields_to_decrypt: List of field names to decrypt
            
        Returns:
            Dictionary with specified fields decrypted
        """
        decrypted_data = data.copy()
        
        for field in fields_to_decrypt:
            if field in decrypted_data and decrypted_data[field] is not None:
                # Handle nested fields specified as 'parent.child'
                if '.' in field:
                    parent, child = field.split('.', 1)
                    if parent in decrypted_data and isinstance(decrypted_data[parent], dict):
                        if child in decrypted_data[parent]:
                            try:
                                decrypted_data[parent][child] = self.decrypt(str(decrypted_data[parent][child]))
                            except:
                                # If decryption fails, keep original value
                                pass
                else:
                    try:
                        decrypted_data[field] = self.decrypt(str(decrypted_data[field]))
                    except:
                        # If decryption fails, keep original value
                        pass
        
        return decrypted_data


# Default encryption instance
# In production, the key should come from environment variables
ENCRYPTION_KEY = os.getenv("FIELD_ENCRYPTION_KEY", "LzlwTnH4mrqLt7lZs_YcvSEUwN2Jl6hzZZCU8iBK9V0=")

encryption = FieldEncryption(ENCRYPTION_KEY)


# Define which fields should be encrypted for different collections
ENCRYPTED_FIELDS = {
    "chat_messages": ["message"],
    "ai_conversations": ["user_message", "ai_response"],
    "severity_logs": ["raw_responses"],  # Responses to questionnaire items
    "mood_logs": ["notes"],
    "session_notes": ["notes", "summary"],
    "treatment_plans": ["notes", "recommendations"],
    "symptoms": ["notes"],
    "crisis_events": ["message"],
    "session_summaries": ["summary", "doctor_notes", "chat_transcript"]
}