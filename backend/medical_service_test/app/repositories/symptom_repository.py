from datetime import datetime

from app.core.database import mongodb
from app.core.encryption import encryptor

COLLECTION = "symptoms"


class SymptomRepository:
    @staticmethod
    def create(
        *,
        user_id: int,
        symptom: str,
        severity: str,
        description: str | None,
    ):
        doc = {
            "user_id": user_id,
            "symptom": symptom,
            "severity": severity,
            "description": encryptor.encrypt(description),
            "created_at": datetime.utcnow(),
        }

        mongodb.db[COLLECTION].insert_one(doc)
        return doc

    @staticmethod
    def list_recent(user_id: int, limit: int = 10):
        cursor = (
            mongodb.db[COLLECTION]
            .find({"user_id": user_id})
            .sort("created_at", -1)
            .limit(limit)
        )

        results = []
        for doc in cursor:
            doc["description"] = encryptor.decrypt(doc.get("description"))
            results.append(doc)

        return results
