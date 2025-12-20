from datetime import datetime
from app.core.database import mongodb
from app.core.encryption import encryptor
from app.core.collections import MOOD_LOGS


class MoodRepository:

    @staticmethod
    def create(
        user_id: int,
        mood: str,
        description: str | None = None,
    ):
        doc = {
            "user_id": user_id,
            "mood": mood,
            "description": encryptor.encrypt(description),
            "created_at": datetime.utcnow(),
        }

        mongodb.db[MOOD_LOGS].insert_one(doc)
        return doc

    @staticmethod
    def list_recent(user_id: int, limit: int = 7):
        docs = (
            mongodb.db[MOOD_LOGS]
            .find({"user_id": user_id})
            .sort("created_at", -1)
            .limit(limit)
        )

        result = []
        for doc in docs:
            doc["description"] = encryptor.decrypt(doc.get("description"))
            result.append(doc)

        return result
