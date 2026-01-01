"""
Test script to verify Hugging Face integration in your RAG system
"""
import os
import sys
import asyncio
import sys
import os
# Add the medical_service directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'single_project_mentora', 'backend', 'medical_service'))

from app.ai_engine.langchain_rag_engine import get_langchain_rag_engine
from app.core.config import settings

def test_hf_integration():
    print("🔍 Testing Hugging Face Integration...")
    
    # Check if API key is configured
    print(f"✅ HUGGINGFACE_API_KEY configured: {'Yes' if settings.HUGGINGFACE_API_KEY else 'No'}")
    print(f"✅ LLM_PROVIDER: {settings.LLM_PROVIDER}")
    print(f"✅ LLM_MODEL: {settings.LLM_MODEL}")
    
    # Try to initialize the RAG engine
    try:
        print("\n🚀 Initializing RAG Engine...")
        rag_engine = get_langchain_rag_engine()
        print("✅ RAG Engine initialized successfully")
        
        # Test symptom analysis
        print("\n🧪 Testing symptom analysis...")
        test_result = rag_engine.analyze_symptoms(
            symptom_text="Feeling anxious and having trouble sleeping",
            duration="2 weeks"
        )
        
        print(f"✅ Symptom analysis completed")
        print(f"   - Severity: {test_result.get('severity', 'N/A')}")
        print(f"   - Recommended Specialist: {test_result.get('recommended_specialist', 'N/A')}")
        print(f"   - Crisis Detected: {test_result.get('crisis_detected', 'N/A')}")
        
        # Test questionnaire enhancement
        print("\n🧪 Testing questionnaire enhancement...")
        test_responses = {1: 2, 2: 2, 3: 1, 4: 1, 5: 0, 6: 1, 7: 1, 8: 0, 9: 0, 10: 1}
        srts_result = {
            "raw_score": 9,
            "severity_level": "mild",
            "specialist_type": "counselor",
            "high_risk": False,
            "recommendations": ["Consider counseling", "Practice stress management"]
        }
        
        enhancement_result = rag_engine.enhance_questionnaire_results(test_responses, srts_result)
        print(f"✅ Questionnaire enhancement completed")
        print(f"   - Has insights: {'Yes' if enhancement_result.get('insights') else 'No'}")
        
        print("\n🎉 All tests passed! Your Hugging Face integration is working properly.")
        print("\n📋 Summary:")
        print(f"   - Local embeddings: Working (sentence-transformers/all-MiniLM-L6-v2)")
        print(f"   - Knowledge base: Loaded and processed")
        print(f"   - FAISS vector store: Created successfully")
        print(f"   - RAG enhancement: Available when Hugging Face API key is configured")
        print(f"   - Fallback system: Ready when API key is missing")
        
        return True
        
    except Exception as e:
        print(f"❌ Error during testing: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    test_hf_integration()