from datetime import datetime
from app.core.database import mongodb
from app.core.encryption import encryptor
from app.core.collections import SEVERITY_LOGS


class SeverityRepository:

    @staticmethod
    def create(
        user_id: int,
        score: int,
        level: str,
        notes: str | None = None,
    ):
        doc = {
            "user_id": user_id,
            "score": score,
            "level": level,
            "notes": encryptor.encrypt(notes),
            "created_at": datetime.utcnow(),
        }

        mongodb.db[SEVERITY_LOGS].insert_one(doc)
        return doc

    @staticmethod
    def get_latest(user_id: int):
        doc = mongodb.db[SEVERITY_LOGS].find_one(
            {"user_id": user_id},
            sort=[("created_at", -1)],
        )

        if not doc:
            return None

        doc["notes"] = encryptor.decrypt(doc.get("notes"))
        return doc
