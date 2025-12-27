"""
test_rag.py - Test script for RAG system functionality
"""

import asyncio
import sys
import os

# Add the app directory to the path so we can import modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.ai_engine.rag_engine import RAGEngine


def test_rag_engine():
    """Test the RAG engine functionality"""
    print("🔍 Testing RAG Engine...")
    
    # Initialize RAG engine
    rag = RAGEngine()
    
    print(f"✅ RAG Engine initialized with {len(rag.knowledge_base)} knowledge entries")
    
    # Test search functionality
    test_queries = [
        "What is anxiety?",
        "Tell me about breathing exercises",
        "How to practice mindfulness",
        "What is CBT therapy"
    ]
    
    for query in test_queries:
        print(f"\n📝 Query: {query}")
        results = rag.search(query, top_k=2)
        
        if results:
            print(f"   Found {len(results)} relevant entries:")
            for i, result in enumerate(results, 1):
                print(f"   {i}. {result['title']} (Score: {result['similarity_score']:.3f})")
                print(f"      Category: {result['category']}")
        else:
            print("   No relevant entries found")
    
    # Test context generation
    print(f"\n📝 Testing context generation for: '5-4-3-2-1 grounding technique'")
    context = rag.get_context_for_prompt("5-4-3-2-1 grounding technique", top_k=1)
    print(f"   Generated context length: {len(context)} characters")
    print(f"   Context preview: {context[:200]}...")
    
    # Test query appropriateness
    print(f"\n📝 Testing query appropriateness:")
    appropriate_queries = [
        "What is depression?",
        "How does CBT work?",
        "Tell me about sleep hygiene"
    ]
    
    inappropriate_queries = [
        "Should I take medication?",
        "Am I suicidal?",
        "How do I diagnose myself?"
    ]
    
    for query in appropriate_queries:
        is_appropriate = rag.is_query_appropriate(query)
        print(f"   '{query}' -> Appropriate: {is_appropriate}")
    
    for query in inappropriate_queries:
        is_appropriate = rag.is_query_appropriate(query)
        print(f"   '{query}' -> Appropriate: {is_appropriate}")
    
    print("\n🎉 RAG Engine test completed!")


if __name__ == "__main__":
    test_rag_engine()