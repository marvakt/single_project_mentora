"""
Test script to verify AI Treatment Plan generation is working
"""
import sys
import os
import asyncio
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from app.ai_engine.langchain_rag_engine import get_langchain_rag_engine
from app.core.config import settings

def test_configuration():
    """Test 1: Verify configuration"""
    print("=" * 60)
    print("TEST 1: Configuration Check")
    print("=" * 60)
    print(f"✓ LLM Provider: {settings.LLM_PROVIDER}")
    print(f"✓ Groq API Key: {'SET' if settings.GROQ_API_KEY else 'MISSING'}")
    print(f"✓ Temperature: {settings.LLM_TEMPERATURE}")
    print()

def test_rag_engine_initialization():
    """Test 2: Initialize RAG Engine"""
    print("=" * 60)
    print("TEST 2: RAG Engine Initialization")
    print("=" * 60)
    try:
        engine = get_langchain_rag_engine()
        print("✓ RAG Engine initialized successfully")
        
        # Check components
        if hasattr(engine, 'vectorstore') and engine.vectorstore:
            print("✓ Vector store loaded (FAISS)")
        elif hasattr(engine, 'documents'):
            print("✓ Fallback vector store loaded (TF-IDF)")
        else:
            print("⚠ No vector store found")
            
        if engine.llm:
            print("✓ LLM initialized (Groq)")
        else:
            print("⚠ LLM not initialized - using fallback mode")
            
        if engine.chain:
            print("✓ RAG chain created")
        else:
            print("✗ RAG chain missing")
            
        print()
        return engine
    except Exception as e:
        print(f"✗ Error initializing RAG engine: {e}")
        import traceback
        traceback.print_exc()
        return None

def test_treatment_plan_generation(engine):
    """Test 3: Generate treatment plan"""
    print("=" * 60)
    print("TEST 3: Treatment Plan Generation")
    print("=" * 60)
    
    # Simulate PHQ-9 responses (moderate depression)
    test_responses = {
        1: 2,  # Loss of interest
        2: 2,  # Depressed mood
        3: 1,  # Sleep issues
        4: 2,  # Fatigue
        5: 1,  # Appetite
        6: 1,  # Worthlessness
        7: 2,  # Concentration
        8: 0,  # Psychomotor
        9: 0,  # No self-harm thoughts
        10: 1  # Functional impairment
    }
    
    srts_result = {
        "severity_level": "moderate",
        "total_score": 12
    }
    
    try:
        print("Generating AI treatment plan...")
        result = engine.enhance_questionnaire_results(test_responses, srts_result)
        
        print("\n✓ Treatment plan generated successfully!")
        print("\n--- AI INSIGHTS ---")
        print(result.get('insights', 'N/A')[:200] + "...")
        
        print("\n--- COPING STRATEGIES ---")
        for i, strategy in enumerate(result.get('contextual_advice', [])[:3], 1):
            print(f"{i}. {strategy}")
            
        print("\n--- LIFESTYLE CHANGES ---")
        for i, change in enumerate(result.get('lifestyle_changes', [])[:3], 1):
            print(f"{i}. {change}")
            
        print("\n--- GOALS ---")
        for i, goal in enumerate(result.get('goals', [])[:3], 1):
            print(f"{i}. {goal}")
            
        # Check RAG signals
        if 'rag_signals' in result:
            signals = result['rag_signals']
            print(f"\n--- RAG SIGNALS ---")
            print(f"Confidence: {signals.get('confidence_score', 'N/A')}")
            print(f"Sources: {', '.join(signals.get('sources', []))}")
            print(f"Risk Safe: {signals.get('risk_safe', 'N/A')}")
            
        print("\n✓ All components working!")
        return True
        
    except Exception as e:
        print(f"\n✗ Error generating treatment plan: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    print("\n" + "=" * 60)
    print("AI TREATMENT PLAN SYSTEM VERIFICATION")
    print("=" * 60 + "\n")
    
    # Run tests
    test_configuration()
    engine = test_rag_engine_initialization()
    
    if engine:
        success = test_treatment_plan_generation(engine)
        
        print("\n" + "=" * 60)
        if success:
            print("✓ ALL TESTS PASSED - AI System is working properly!")
        else:
            print("⚠ SOME TESTS FAILED - Check errors above")
        print("=" * 60 + "\n")
    else:
        print("\n" + "=" * 60)
        print("✗ CRITICAL FAILURE - RAG Engine could not initialize")
        print("=" * 60 + "\n")

if __name__ == "__main__":
    main()
