
import pymongo
import os
import sys

# Config - Assuming default docker ports or localhost mapping
# The user is running this on their machine/agent, so localhost usually works if ports are mapped.
MONGO_URI = "mongodb://localhost:27017"
DB_NAME = "mentora_medical"

def inspect_data():
    try:
        client = pymongo.MongoClient(MONGO_URI, serverSelectionTimeoutMS=2000)
        db = client[DB_NAME]
        
        print(f"--- Inspecting DB: {DB_NAME} ---")
        
        # Check collections
        col_names = db.list_collection_names()
        print(f"Collections: {col_names}")
        
        # 1. Severity Logs
        print("\n--- Severity Logs (User IDs) ---")
        severity_users = db.severity_logs.distinct("user_id")
        print(f"Found {len(severity_users)} unique user IDs:")
        for uid in severity_users:
            print(f" - '{uid}' (Type: {type(uid).__name__})")
            
        # Sample Document
        if severity_users:
            doc = db.severity_logs.find_one()
            print("Sample Severity Doc:", doc)

        # 2. Mood Logs
        print("\n--- Mood Logs (User IDs) ---")
        mood_users = db.mood_logs.distinct("user_id")
        print(f"Found {len(mood_users)} unique user IDs:")
        for uid in mood_users:
            print(f" - '{uid}' (Type: {type(uid).__name__})")
            
    except Exception as e:
        print(f"❌ Error connecting/reading Mongo: {e}")
        # Fallback explanation
        print("Note: If basic connection fails, ensure MongoDB is running and port 27017 is mapped to localhost.")

if __name__ == "__main__":
    inspect_data()
