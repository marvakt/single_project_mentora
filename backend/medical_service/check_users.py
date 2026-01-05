
import os
from pymongo import MongoClient

# Default Mongo URI for docker/local
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")

try:
    client = MongoClient(MONGO_URI)
    db = client['mentora_db'] # Assuming shared DB name from previous knowledge or guessing
    
    # Try to find users
    users = list(db.users.find({}, {"_id": 0, "id": 1, "username": 1, "email": 1, "role": 1}).limit(5))
    
    print(f"Found {len(users)} users:")
    for user in users:
        print(user)

except Exception as e:
    print(f"Error: {e}")
