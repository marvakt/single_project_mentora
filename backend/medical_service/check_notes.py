
import asyncio
import os
import sys
from pprint import pprint

# Setup path
sys.path.append(os.getcwd())

from app.core.database import connect_db, get_database, close_db

async def check_notes():
    # Force localhost for running script from host
    os.environ["MONGODB_URL"] = "mongodb://localhost:27018/medical_db" # Assuming 27018 based on typical docker-compose mapping, or 27017 if direct. Let's try 27017 first if 27018 fails.
    # Actually, let's check docker ps to see the port mapping first. 
    # But for now, let's try 27017 as that's standard, or checking docker-compose.
    
    # Better approach: Check docker-compose or just try localhost based on standard mappings.
    # I'll check docker-compose.yml first.
    pass

async def check_notes():
    # Run inside Docker container
    os.environ["MONGO_URI"] = "mongodb://mongo_medical:27017" 
    os.environ["MONGO_DB"] = "mentora_medical"
    
    print("Connecting to DB (Docker Internal)...")
    await connect_db()
    
    db = get_database()
    
    print("\n--- Checking Session Notes Collection ---")
    count = await db.session_notes.count_documents({})
    print(f"Total Session Notes: {count}")
    
    cursor = db.session_notes.find({})
    notes = await cursor.to_list(length=10)
    
    for note in notes:
        print("\nNote Found:")
        print(f"  ID: {note['_id']}")
        print(f"  Appt ID: {note.get('appointment_id')}")
        print(f"  Doctor ID: {note.get('doctor_id')}")
        print(f"  User ID: {note.get('user_id')}")
        # We won't decrypt here to keep it simple, just checking existence and IDs
        
    await close_db()

if __name__ == "__main__":
    asyncio.run(check_notes())
