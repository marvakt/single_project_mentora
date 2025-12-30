"""
test_huggingface_setup.py - Quick test to verify HuggingFace API key works

Run this BEFORE starting the full RAG system to verify your setup.
"""

import os
import sys

def test_huggingface_key():
    """Test if HuggingFace API key is configured"""
    print("🔍 Testing HuggingFace Setup...\n")
    
    # Check API key
    api_key = os.getenv("HUGGINGFACE_API_KEY")
    
    if not api_key:
        print("❌ HUGGINGFACE_API_KEY not found in environment")
        print("\n📝 To fix:")
        print("   export HUGGINGFACE_API_KEY='hf_your_token_here'")
        print("\n💡 Get free API key:")
        print("   1. Sign up: https://huggingface.co/join")
        print("   2. Get token: https://huggingface.co/settings/tokens")
        return False
    
    if not api_key.startswith("hf_"):
        print(f"⚠️  API key doesn't look right: {api_key[:10]}...")
        print("   HuggingFace tokens should start with 'hf_'")
        return False
    
    print(f"✅ API key found: {api_key[:10]}...{api_key[-5:]}")
    
    # Test API connection
    print("\n🌐 Testing API connection...")
    
    try:
        from langchain_huggingface import HuggingFaceEndpoint
        
        llm = HuggingFaceEndpoint(
            repo_id="mistralai/Mistral-7B-Instruct-v0.2",
            huggingfacehub_api_token=api_key,
            temperature=0.3,
            max_new_tokens=100
        )
        
        print("   Sending test query...")
        response = llm.invoke("What is anxiety? Answer in one sentence.")
        
        print(f"\n✅ API Response received:")
        print(f"   {response[:200]}...")
        
        print("\n🎉 HuggingFace setup is working!")
        print("\n✅ You're ready to use the RAG system")
        print("\n📝 Next steps:")
        print("   1. Start service: uvicorn app.main:app --port 8003")
        print("   2. Run tests: python test_rag_severity.py")
        
        return True
        
    except ImportError:
        print("❌ langchain_community not installed")
        print("\n📝 To fix:")
        print("   pip install -r requirements.txt")
        return False
        
    except Exception as e:
        print(f"❌ Error testing API: {str(e)}")
        print("\n💡 Common issues:")
        print("   - Invalid API key")
        print("   - Network connection problem")
        print("   - Rate limit exceeded (unlikely on free tier)")
        return False


def check_dependencies():
    """Check if required packages are installed"""
    print("\n📦 Checking dependencies...\n")
    
    required = [
        "langchain",
        "langchain_community",
        "faiss",
        "sentence_transformers"
    ]
    
    missing = []
    
    for package in required:
        try:
            __import__(package.replace("-", "_"))
            print(f"   ✅ {package}")
        except ImportError:
            print(f"   ❌ {package}")
            missing.append(package)
    
    if missing:
        print(f"\n❌ Missing packages: {', '.join(missing)}")
        print("\n📝 To fix:")
        print("   pip install -r requirements.txt")
        return False
    
    print("\n✅ All dependencies installed")
    return True


def main():
    print("\n" + "="*60)
    print("  HuggingFace Setup Verification")
    print("="*60 + "\n")
    
    # Check dependencies first
    if not check_dependencies():
        print("\n❌ Setup incomplete - install dependencies first")
        sys.exit(1)
    
    # Test API key
    if not test_huggingface_key():
        print("\n❌ Setup incomplete - configure API key")
        sys.exit(1)
    
    print("\n" + "="*60)
    print("  ✅ ALL CHECKS PASSED!")
    print("="*60 + "\n")


if __name__ == "__main__":
    main()
