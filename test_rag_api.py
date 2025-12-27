"""
test_rag_api.py - Test script for RAG API endpoints
"""

import requests
import json


def test_rag_chat_endpoint():
    """Test the RAG chat endpoint"""
    print("🔍 Testing RAG Chat Endpoint...")
    
    # Test URL - assuming the service is running on localhost:8003
    url = "http://localhost:8003/api/v1/chat/chat"
    
    # Test headers (we'll need a valid JWT token for this to work fully)
    headers = {
        "Content-Type": "application/json"
    }
    
    # Test payloads
    test_messages = [
        {
            "message": "What is anxiety?",
            "user_id": "test_user_123"  # This would normally be provided by auth
        },
        {
            "message": "Tell me about breathing exercises",
            "user_id": "test_user_123"
        },
        {
            "message": "How to practice mindfulness",
            "user_id": "test_user_123"
        }
    ]
    
    for i, payload in enumerate(test_messages, 1):
        print(f"\n📝 Test {i}: {payload['message']}")
        try:
            response = requests.post(url, headers=headers, json=payload)
            print(f"   Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"   Response Type: {data.get('message_type', 'unknown')}")
                print(f"   Response Length: {len(data.get('response', ''))} characters")
                print(f"   Sources Found: {len(data.get('sources', []))}")
            else:
                print(f"   Error: {response.text}")
                
        except requests.exceptions.ConnectionError:
            print("   ❌ Connection error - service may not be running")
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")


def test_rag_search_endpoint():
    """Test the RAG search endpoint"""
    print("\n🔍 Testing RAG Search Endpoint...")
    
    url = "http://localhost:8003/api/v1/chat/search-knowledge"
    
    headers = {
        "Content-Type": "application/json"
    }
    
    test_messages = [
        {
            "message": "CBT therapy",
            "user_id": "test_user_123"
        },
        {
            "message": "grounding techniques",
            "user_id": "test_user_123"
        }
    ]
    
    for i, payload in enumerate(test_messages, 1):
        print(f"\n📝 Search Test {i}: {payload['message']}")
        try:
            response = requests.post(url, headers=headers, json=payload)
            print(f"   Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"   Results Found: {len(data)}")
                for j, result in enumerate(data[:2], 1):  # Show first 2 results
                    print(f"   {j}. {result.get('title', 'No title')} [{result.get('category', 'No category')}]")
            else:
                print(f"   Error: {response.text}")
                
        except requests.exceptions.ConnectionError:
            print("   ❌ Connection error - service may not be running")
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")


def test_available_topics():
    """Test the available topics endpoint"""
    print("\n🔍 Testing Available Topics Endpoint...")
    
    url = "http://localhost:8003/api/v1/chat/available-topics"
    
    headers = {
        "Content-Type": "application/json"
    }
    
    payload = {
        "user_id": "test_user_123"
    }
    
    print(f"\n📝 Fetching available topics")
    try:
        response = requests.get(url, headers=headers, json=payload)
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   Total Entries: {data.get('total_entries', 0)}")
            categories = data.get('categories', {})
            print(f"   Categories: {list(categories.keys())}")
            
            for category, topics in categories.items():
                print(f"   {category}: {len(topics)} topics")
        else:
            print(f"   Error: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("   ❌ Connection error - service may not be running")
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")


if __name__ == "__main__":
    print("🧪 Testing RAG API Endpoints")
    print("=" * 50)
    
    # Note: These tests will show connection errors if the service isn't running
    # That's expected if the service is not currently active
    test_rag_chat_endpoint()
    test_rag_search_endpoint()
    test_available_topics()
    
    print("\n🎉 RAG API test completed!")
    print("\n💡 Note: If you see connection errors, make sure the medical service is running on port 8003")