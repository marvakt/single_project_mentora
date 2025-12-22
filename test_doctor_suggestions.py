import requests
import json

# Test the doctor suggestion endpoint
def test_doctor_suggestions():
    # First, let's check if there are any doctors
    try:
        response = requests.get('http://localhost:8001/api/doctors/')
        print("Doctors list response:", response.status_code)
        print("Doctors data:", response.json())
    except Exception as e:
        print("Error fetching doctors:", e)
    
    # Now let's test the suggestion endpoint with a sample severity score
    try:
        # We need to authenticate first, so let's test without auth to see the error
        suggestion_data = {
            "severity_score": 8
        }
        response = requests.post(
            'http://localhost:8001/api/doctors/suggest/',
            json=suggestion_data,
            headers={'Content-Type': 'application/json'}
        )
        print("\nDoctor suggestion response:", response.status_code)
        print("Doctor suggestion data:", response.json())
    except Exception as e:
        print("Error with doctor suggestions:", e)

if __name__ == "__main__":
    test_doctor_suggestions()