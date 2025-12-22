import requests
import json

def populate_doctors():
    """
    Script to populate the database with sample doctors for testing
    """
    
    # First, let's check if we can access the admin panel or create doctors directly
    try:
        # Try to get doctors list
        response = requests.get('http://localhost:8001/api/doctors/')
        print("Current doctors:", response.json())
        
        # Try to register a few doctors
        doctors_data = [
            {
                "email": "dr.johnson@example.com",
                "password": "SecurePass123!",
                "role": "doctor",
                "name": "Dr. Sarah Johnson",
                "specialization": "Clinical Psychology",
                "experience_years": 12,
                "consultation_fee": 1500
            },
            {
                "email": "dr.chen@example.com", 
                "password": "SecurePass123!",
                "role": "doctor",
                "name": "Dr. Michael Chen",
                "specialization": "Cognitive Behavioral Therapy",
                "experience_years": 8,
                "consultation_fee": 1200
            },
            {
                "email": "dr.rodriguez@example.com",
                "password": "SecurePass123!",
                "role": "doctor", 
                "name": "Dr. Emily Rodriguez",
                "specialization": "Anxiety Disorders",
                "experience_years": 15,
                "consultation_fee": 1800
            }
        ]
        
        print("\nAttempting to register doctors...")
        for i, doctor in enumerate(doctors_data):
            try:
                # Register doctor
                reg_response = requests.post(
                    'http://localhost:8000/api/register/',
                    json={
                        "email": doctor["email"],
                        "password": doctor["password"],
                        "role": doctor["role"]
                    },
                    headers={'Content-Type': 'application/json'}
                )
                print(f"Doctor {i+1} registration: {reg_response.status_code}")
                
                # Note: In a real scenario, we'd need to verify OTP and then create profile
                # For now, let's simulate what would happen after verification
                
            except Exception as e:
                print(f"Error registering doctor {i+1}: {e}")
                
        print("\nDoctor population script completed.")
        print("Note: Actual doctor profiles require manual verification and profile completion.")
        
    except Exception as e:
        print(f"Error in populate_doctors: {e}")

if __name__ == "__main__":
    populate_doctors()