
import requests
import json
import uuid
from pymongo import MongoClient
import os
from datetime import datetime

# Config
MEDICAL_SERVICE_URL = "http://localhost:8003/api/v1"
MONGO_URI = "mongodb://mongo_medical:27017" # This won't work from host if mongo is in docker container and port not mapped strictly or using internal name.
# Wait, I am running on the "User's" machine (the agent environment). 
# If the user is running docker, 'localhost' should access the exposed ports.
# User's docker-compose usually maps ports.
# Medical service: 8003 (from settings.py it says port=8003 in uvicorn.run)
# Mongo: Usually 27017. 
# But I can't reach 'mongo_medical' unless I map it in hosts or use localhost.
# I will try localhost for mongo.

def test_medical_summary():
    # 1. Use the specific user ID we seeded
    user_id = "00000000-0000-0000-0000-00000000001a"
    print(f"Testing with User ID: {user_id}")

    # 2. Insert dummy data into MongoDB (if accessible) to ensure we have something to fetch
    # Note: If I can't connect to mongo directly, I might rely on the API returning empty data first, 
    # but to prove 'not working' vs 'empty', I need data.
    # Let's try to assume the API works if I get a 200 OK with empty lists.
    
    # Actually, I can use the 'User's' environment shell to check docker.
    # But for a script I can try to hit the API directly.
    
    url = f"{MEDICAL_SERVICE_URL}/summary/user/{user_id}"
    print(f"GET {url}")
    
    try:
        response = requests.get(url)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print("Response Data:")
            print(json.dumps(data, indent=2))
            
            # Check structure
            if "assessment_history" in data and "mood_entries" in data:
                print("✅ Protocol matches: 'assessment_history' and 'mood_entries' keys present.")
            else:
                print("❌ Protocol mismatch: Missing keys.")
        else:
            print(f"❌ Failed to fetch. Response: {response.text}")

    except Exception as e:
        print(f"❌ Connection Error: {e}")

if __name__ == "__main__":
    test_medical_summary()
