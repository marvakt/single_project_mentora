
import subprocess
import requests
import jwt
import time
from datetime import datetime
import sys

# Config
BASE_URL = "http://localhost:8003/api/v1"
JWT_SECRET = "mentora-jwt-secret-2025-change-this"
JWT_ALGORITHM = "HS256"

def generate_token(user_id):
    # Set expiration to 10 years in the future
    future_time = datetime.utcnow().timestamp() + (365 * 24 * 3600 * 10)
    payload = {
        "user_id": user_id,
        "role": "user",
        "exp": future_time
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def get_patient_ids():
    print("🔍 Fetching Patient IDs from Appointment DB (via Docker)...")
    cmd = [
        "docker", "exec", "backend-postgres_appointment-1",
        "psql", "-U", "appointment_user", "-d", "appointment_db",
        "-t", "-c", "SELECT DISTINCT user_id FROM appointments;"
    ]
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        # Parse output: remove whitespace, skip empty lines
        raw_ids = result.stdout.strip().split('\n')
        patient_ids = [pid.strip() for pid in raw_ids if pid.strip()]
        
        print(f"✅ Found {len(patient_ids)} unique patients: {patient_ids}")
        return patient_ids
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to query DB: {e.stderr}")
        return []

def seed_data_for_user(user_id):
    print(f"\n🌱 Seeding for User: {user_id}")
    
    token = generate_token(user_id)
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # 1. Check if data already exists (to avoid duplicates/spamming)
    summary_url = f"{BASE_URL}/summary/user/{user_id}"
    try:
        resp = requests.get(summary_url)
        if resp.status_code == 200:
            data = resp.json()
            if data.get("assessment_history") or data.get("mood_entries"):
                print("   ⚠️ Data already exists. Skipping.")
                return
    except Exception as e:
        print(f"   ⚠️ Could not check existing data: {e}")

    # 2. Create Mood Logs
    print("   ... Creating Mood Logs")
    mood_endpoint = f"{BASE_URL}/mood/log"
    moods = [
        {"mood_level": 7, "energy_level": 6, "stress_level": 4, "sleep_quality": 7, "notes": "Feeling okay."},
        {"mood_level": 6, "energy_level": 5, "stress_level": 5, "sleep_quality": 6, "notes": "Average day."},
        {"mood_level": 8, "energy_level": 8, "stress_level": 2, "sleep_quality": 8, "notes": "Great progress!"}
    ]
    
    for m in moods:
        try:
            resp = requests.post(mood_endpoint, json=m, headers=headers)
            if resp.status_code not in [200, 201]:
                 print(f"   ❌ Mood Log Failed: {resp.status_code}")
        except Exception:
            pass

    # 3. Create Assessment Logs
    print("   ... Creating Assessment Logs")
    quest_endpoint = f"{BASE_URL}/questionnaire/submit"
    assessments = [
        {
            "responses": {
                "1": 1, "2": 1, "3": 0, "4": 1, "5": 0, 
                "6": 0, "7": 1, "8": 0, "9": 0, "10": 1
            },
            "notes": "Mild symptoms reported."
        }
    ]
    
    for a in assessments:
        try:
            resp = requests.post(quest_endpoint, json=a, headers=headers)
            if resp.status_code not in [200, 201]:
                 print(f"   ❌ Assessment Failed: {resp.status_code}")
        except Exception:
            pass
            
    print("   ✅ Done.")

def main():
    ids = get_patient_ids()
    if not ids:
        print("No patients found or DB error.")
        return

    print(f"Starting seeding for {len(ids)} patients...")
    for uid in ids:
        seed_data_for_user(uid)
    
    print("\n🏁 All patients processed.")

if __name__ == "__main__":
    main()
