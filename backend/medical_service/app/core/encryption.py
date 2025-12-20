from cryptography.fernet import Fernet
from app.core.config import settings


class FieldEncryptor:
    def __init__(self):
        self.fernet = Fernet(settings.field_encryption_key.encode())

    def encrypt(self, value: str | None) -> str | None:
        if value is None:
            return None
        return self.fernet.encrypt(value.encode()).decode()

    def decrypt(self, value: str | None) -> str | None:
        if value is None:
            return None
        return self.fernet.decrypt(value.encode()).decode()


encryptor = FieldEncryptor()
