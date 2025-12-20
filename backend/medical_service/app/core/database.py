from pymongo import MongoClient
from app.core.config import settings


class MongoDB:
    def __init__(self):
        self.client: MongoClient | None = None

    def connect(self):
        self.client = MongoClient(settings.mongo_uri)

    def close(self):
        if self.client:
            self.client.close()

    @property
    def db(self):
        if not self.client:
            raise RuntimeError("MongoDB not connected")
        return self.client[settings.mongo_db]


mongodb = MongoDB()
