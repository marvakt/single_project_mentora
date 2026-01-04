
import requests
import json
import random
from datetime import datetime
import uuid

# Config
BASE_URL = "http://localhost:8003/api/v1"
TARGET_USER_ID = "00000000-0000-0000-0000-00000000001a"


import jwt

# Valid Secret from Medical Service config
JWT_SECRET = "mentora-jwt-secret-2025-change-this"
JWT_ALGORITHM = "HS256"

def generate_token(user_id):
    # Set expiration to 10 years in the future to avoid time sync issues
    future_time = datetime.utcnow().timestamp() + (365 * 24 * 3600 * 10)
    payload = {
        "user_id": user_id,
        "role": "user",
        "exp": future_time
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def seed_data():
    print(f"🌱 Seeding data for User: {TARGET_USER_ID}")
    
    token = generate_token(TARGET_USER_ID)
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # 1. Create Mood Logs
    print("... Creating Mood Logs")
    mood_endpoint = f"{BASE_URL}/mood/log"
    
    moods = [
        {"mood_level": 8, "energy_level": 7, "stress_level": 3, "sleep_quality": 8, "notes": "Feeling good today!"},
        {"mood_level": 5, "energy_level": 4, "stress_level": 6, "sleep_quality": 6, "notes": "A bit tired."},
        {"mood_level": 3, "energy_level": 3, "stress_level": 8, "sleep_quality": 4, "notes": "Stressful work day."}
    ]
    
    for m in moods:
        try:
            resp = requests.post(mood_endpoint, json=m, headers=headers)
            if resp.status_code == 200 or resp.status_code == 201:
                print(f"Mood Log Status: {resp.status_code}")
            else:
                print(f"Mood Log Status: {resp.status_code} - {resp.text}")
        except Exception as e:
            print(f"Failed to post mood: {e}")

    # 2. Create Assessment (Questionnaire) Logs
    print("... Creating Assessment Logs")
    quest_endpoint = f"{BASE_URL}/questionnaire/submit"
    
    # Sample PHQ-9 responses (Moderate Severity)
    assessments = [
        {
            "responses": {
                "1": 2, "2": 2, "3": 1, "4": 2, "5": 1, 
                "6": 1, "7": 2, "8": 0, "9": 0, "10": 2
            },
            "notes": "Feeling overwhelmed lately."
        },
        {
            "responses": {
                "1": 3, "2": 3, "3": 2, "4": 3, "5": 1, 
                "6": 2, "7": 2, "8": 1, "9": 0, "10": 3
            },
            "notes": "Rough week."
        }
    ]
    
    for a in assessments:
        try:
            resp = requests.post(quest_endpoint, json=a, headers=headers)
            if resp.status_code == 200 or resp.status_code == 201:
                print(f"Assessment Log Status: {resp.status_code}")
            else:
                print(f"Assessment Log Status: {resp.status_code} - {resp.text}")
        except Exception as e:
            print(f"Failed to post assessment: {e}")
            
    print("✅ Seeding complete. Check dashboard.")
    

if __name__ == "__main__":
    seed_data()
