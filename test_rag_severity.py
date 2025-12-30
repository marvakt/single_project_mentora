"""
test_rag_severity.py - Test script for RAG-powered severity analyzer

This script tests the new RAG-based symptom analysis endpoint.
Run this after starting the medical_service to verify RAG functionality.
"""

import requests
import json
from typing import Dict, Any


# Configuration
BASE_URL = "http://localhost:8003/api/v1/severity"
# You'll need a valid JWT token for authenticated requests
# For testing, you can get this from the frontend after logging in
AUTH_TOKEN = ""  # Add your JWT token here


def print_section(title: str):
    """Print a formatted section header"""
    print("\n" + "=" * 80)
    print(f"  {title}")
    print("=" * 80 + "\n")


def print_analysis(analysis: Dict[str, Any]):
    """Pretty print analysis results"""
    print(f"📊 Severity: {analysis.get('severity', 'N/A')}")
    print(f"🎯 Confidence: {analysis.get('confidence', 'N/A')}")
    print(f"⚠️  Crisis Detected: {analysis.get('crisis_detected', False)}")
    print(f"⏰ Urgency: {analysis.get('urgency', 'N/A')}")
    print(f"👨‍⚕️  Recommended Specialist: {analysis.get('recommended_specialist', 'N/A')}")
    
    print(f"\n🔍 Symptoms Detected:")
    for symptom in analysis.get('symptoms_detected', []):
        print(f"   • {symptom}")
    
    print(f"\n💡 Advice:")
    for advice in analysis.get('advice', []):
        print(f"   • {advice}")
    
    print(f"\n📝 Reasoning:")
    print(f"   {analysis.get('reasoning', 'N/A')}")
    
    if analysis.get('sources'):
        print(f"\n📚 Knowledge Sources:")
        for source in analysis.get('sources', []):
            print(f"   • {source}")


def test_analyze_symptoms(symptom_text: str, duration: str = None, description: str = ""):
    """Test the /analyze-symptoms endpoint"""
    print_section(f"TEST: {description}")
    
    headers = {
        "Content-Type": "application/json"
    }
    
    if AUTH_TOKEN:
        headers["Authorization"] = f"Bearer {AUTH_TOKEN}"
    
    payload = {
        "symptoms": symptom_text,
        "duration": duration
    }
    
    print(f"📤 Input:")
    print(f"   Symptoms: {symptom_text}")
    if duration:
        print(f"   Duration: {duration}")
    
    try:
        response = requests.post(
            f"{BASE_URL}/analyze-symptoms",
            headers=headers,
            json=payload,
            timeout=30
        )
        
        print(f"\n📥 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            analysis = response.json()
            print_analysis(analysis)
            return analysis
        else:
            print(f"❌ Error: {response.text}")
            return None
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection error - is the medical service running on port 8003?")
        return None
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return None


def test_analysis_history():
    """Test the /analysis-history endpoint"""
    print_section("TEST: Analysis History")
    
    headers = {
        "Content-Type": "application/json"
    }
    
    if AUTH_TOKEN:
        headers["Authorization"] = f"Bearer {AUTH_TOKEN}"
    
    try:
        response = requests.get(
            f"{BASE_URL}/analysis-history",
            headers=headers,
            timeout=10
        )
        
        print(f"📥 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"\n📊 Total Analyses: {data.get('total_count', 0)}")
            
            for i, analysis in enumerate(data.get('analyses', [])[:3], 1):
                print(f"\n{i}. Analysis from {analysis.get('created_at', 'N/A')}")
                print(f"   Severity: {analysis.get('analysis', {}).get('severity', 'N/A')}")
                print(f"   Input: {analysis.get('symptom_input', 'N/A')[:100]}...")
        else:
            print(f"❌ Error: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")


def main():
    """Run all tests"""
    print("\n" + "🧪" * 40)
    print("  RAG-Powered Severity Analyzer - Test Suite")
    print("🧪" * 40)
    
    # Test cases covering different severity levels
    test_cases = [
        {
            "symptoms": "I've been feeling a bit stressed lately, having trouble sleeping sometimes, and feeling tired during the day",
            "duration": "1 week",
            "description": "Mild Symptoms - Expected: Counselor"
        },
        {
            "symptoms": "I haven't been sleeping for 3 weeks, feeling very anxious, lost interest in things I used to enjoy, trouble focusing at work",
            "duration": "3 weeks",
            "description": "Moderate Symptoms - Expected: Psychologist"
        },
        {
            "symptoms": "Severe depression for 2 months, can't get out of bed, thoughts of self-harm, no energy, lost 15 pounds, can't work",
            "duration": "2 months",
            "description": "Severe Symptoms - Expected: Psychiatrist + Crisis Detection"
        },
        {
            "symptoms": "Panic attacks daily, can't leave the house, constant worry, heart racing, feeling like I'm going to die",
            "duration": "1 month",
            "description": "Severe Anxiety - Expected: Psychologist/Psychiatrist"
        },
        {
            "symptoms": "Feeling sad after breakup, crying sometimes, but still going to work and seeing friends",
            "duration": "2 weeks",
            "description": "Situational Sadness - Expected: Mild/Counselor"
        }
    ]
    
    # Run tests
    results = []
    for test_case in test_cases:
        result = test_analyze_symptoms(
            symptom_text=test_case["symptoms"],
            duration=test_case["duration"],
            description=test_case["description"]
        )
        results.append(result)
        
        # Small delay between tests
        import time
        time.sleep(2)
    
    # Test history endpoint
    if AUTH_TOKEN:
        test_analysis_history()
    
    # Summary
    print_section("TEST SUMMARY")
    successful = sum(1 for r in results if r is not None)
    print(f"✅ Successful tests: {successful}/{len(test_cases)}")
    print(f"❌ Failed tests: {len(test_cases) - successful}/{len(test_cases)}")
    
    if not AUTH_TOKEN:
        print("\n⚠️  Note: Tests run without authentication. Add AUTH_TOKEN for full testing.")
    
    print("\n" + "🧪" * 40)
    print("\n💡 Next Steps:")
    print("   1. Install dependencies: pip install -r requirements.txt")
    print("   2. Set OPENAI_API_KEY or HUGGINGFACE_API_KEY in environment")
    print("   3. Start medical_service: uvicorn app.main:app --port 8003")
    print("   4. Run this test script: python test_rag_severity.py")
    print("\n")


if __name__ == "__main__":
    main()
