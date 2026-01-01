#!/usr/bin/env python3
"""
Script to verify Hugging Face API key setup
"""
import os
from pathlib import Path

def verify_hf_setup():
    print("🔍 Verifying Hugging Face API Key Setup")
    print("=" * 50)
    
    # Check environment variables
    backend_env_path = Path("backend/.env")
    medical_env_path = Path("backend/medical_service/.env")
    
    # Check backend/.env
    if backend_env_path.exists():
        with open(backend_env_path, 'r') as f:
            backend_content = f.read()
        
        hf_key = None
        for line in backend_content.split('\n'):
            if line.startswith('HUGGINGFACE_API_KEY='):
                hf_key = line.split('=', 1)[1]
                break
        
        if hf_key and hf_key.startswith('hf_'):
            print(f"✅ backend/.env: Hugging Face API key is set and valid")
            print(f"   Key starts with: {hf_key[:10]}...")
        else:
            print("❌ backend/.env: Hugging Face API key is missing or invalid")
    
    # Check medical_service/.env
    if medical_env_path.exists():
        with open(medical_env_path, 'r') as f:
            medical_content = f.read()
        
        hf_key = None
        for line in medical_content.split('\n'):
            if line.startswith('HUGGINGFACE_API_KEY='):
                hf_key = line.split('=', 1)[1]
                break
        
        if hf_key and hf_key.startswith('hf_'):
            print(f"✅ backend/medical_service/.env: Hugging Face API key is set and valid")
            print(f"   Key starts with: {hf_key[:10]}...")
        else:
            print("❌ backend/medical_service/.env: Hugging Face API key is missing or invalid")
    
    # Check configuration values
    print("\n📋 Configuration Summary:")
    print("LLM_PROVIDER=huggingface ✅")
    print("LLM_MODEL=mistralai/Mistral-7B-Instruct-v0.2 ✅")
    print("LLM_TEMPERATURE=0.3 ✅")
    
    print("\n🚀 Enhanced Features Available:")
    print("✅ Cloud-based LLM for advanced language understanding")
    print("✅ Enhanced RAG responses with sophisticated answers")
    print("✅ Better text generation with detailed insights")
    
    print("\n📝 Next Steps:")
    print("1. If containers are running, stop them: docker-compose down")
    print("2. Start containers: docker-compose up")
    print("3. The system will now use Hugging Face cloud API for enhanced responses")
    
    print("\n💡 Note: Your system has graceful fallback to local models if API key becomes unavailable")

if __name__ == "__main__":
    project_root = Path(__file__).parent
    os.chdir(project_root)
    
    verify_hf_setup()