"""
app/ai_engine/rag_engine.py - RAG (Retrieval-Augmented Generation) Engine
Provides knowledge retrieval for mental wellness chatbot with safety boundaries
"""

import json
import logging
from typing import List, Dict, Optional
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import os
import re
from sentence_transformers import SentenceTransformer

logger = logging.getLogger(__name__)


class RAGEngine:
    """
    RAG (Retrieval-Augmented Generation) Engine
    Provides knowledge retrieval for mental wellness chatbot with safety boundaries.
    
    RAG is used EXCLUSIVELY for knowledge retrieval to ground responses in
    vetted psychoeducational content and coping-exercise explanations.
    RAG is NEVER used for decision-making, risk assessment, or clinical judgments.
    """
    
    def __init__(self, knowledge_base_path: str = None):
        """
        Initialize RAG Engine with knowledge base and embedding model
        
        Args:
            knowledge_base_path: Path to knowledge base JSON file
        """
        self.knowledge_base_path = knowledge_base_path or os.path.join(
            os.path.dirname(__file__), "..", "knowledge_base", "mental_health_knowledge.json"
        )
        
        # Load knowledge base
        self.knowledge_base = self._load_knowledge_base()
        
        # Initialize embedding model
        self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        
        # Pre-compute embeddings for all knowledge base entries
        self._precompute_embeddings()
        
        logger.info(f"RAG Engine initialized with {len(self.knowledge_base)} knowledge entries")
    
    def _load_knowledge_base(self) -> List[Dict]:
        """
        Load knowledge base from JSON file
        
        Returns:
            List of knowledge base entries
        """
        try:
            with open(self.knowledge_base_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Return the knowledge base entries
            return data.get('knowledge_base', [])
        
        except FileNotFoundError:
            logger.error(f"Knowledge base file not found: {self.knowledge_base_path}")
            return []
        
        except json.JSONDecodeError:
            logger.error(f"Invalid JSON in knowledge base file: {self.knowledge_base_path}")
            return []
    
    def _precompute_embeddings(self):
        """
        Pre-compute embeddings for all knowledge base entries
        """
        if not self.knowledge_base:
            self.embeddings = np.array([])
            return
        
        # Create combined text for each entry (title + content)
        texts = []
        for entry in self.knowledge_base:
            combined_text = f"{entry['title']} {entry['content']}"
            texts.append(combined_text)
        
        # Compute embeddings
        self.embeddings = self.embedding_model.encode(texts)
        
        logger.info(f"Precomputed embeddings for {len(self.embeddings)} knowledge entries")
    
    def search(self, query: str, top_k: int = 3) -> List[Dict]:
        """
        Search knowledge base for relevant entries based on query
        
        Args:
            query: User query to search for
            top_k: Number of top results to return
            
        Returns:
            List of relevant knowledge base entries with similarity scores
        """
        if not self.knowledge_base or len(self.embeddings) == 0:
            return []
        
        # Compute embedding for query
        query_embedding = self.embedding_model.encode([query])
        
        # Calculate cosine similarity
        similarities = cosine_similarity(query_embedding, self.embeddings)[0]
        
        # Get top-k most similar entries
        top_indices = np.argsort(similarities)[::-1][:top_k]
        
        results = []
        for idx in top_indices:
            similarity_score = similarities[idx]
            if similarity_score > 0.1:  # Only return results above threshold
                entry = self.knowledge_base[idx].copy()
                entry['similarity_score'] = float(similarity_score)
                results.append(entry)
        
        logger.info(f"RAG search query: '{query[:50]}...' -> Found {len(results)} relevant entries")
        return results
    
    def get_context_for_prompt(self, query: str, top_k: int = 3) -> str:
        """
        Get formatted context for LLM prompt based on query
        
        Args:
            query: User query
            top_k: Number of top results to include
            
        Returns:
            Formatted context string for LLM prompt
        """
        results = self.search(query, top_k)
        
        if not results:
            return "I don't have specific information about this topic. Please consult with a mental health professional for personalized guidance."
        
        # Format context
        context_parts = []
        for result in results:
            context_parts.append(f"Topic: {result['title']}")
            context_parts.append(f"Content: {result['content']}")
            context_parts.append("---")
        
        context = "\n".join(context_parts)
        
        return context
    
    def is_query_appropriate(self, query: str) -> bool:
        """
        Check if query is appropriate for RAG (non-clinical, educational)
        
        Args:
            query: User query to check
            
        Returns:
            True if query is appropriate for RAG, False otherwise
        """
        # List of inappropriate query patterns (diagnostic, clinical decision-making)
        inappropriate_keywords = [
            "diagnose", "diagnosis", "should i", "am i", "is this", 
            "treat", "prescribe", "medication", "cure", "fix", 
            "suicidal", "kill myself", "hurt myself", "crisis",
            "emergency", "immediate", "urgent", "dangerous"
        ]
        
        query_lower = query.lower()
        for keyword in inappropriate_keywords:
            if keyword in query_lower:
                return False
        
        return True


# Global RAG instance
rag_engine = None


def get_rag_engine() -> RAGEngine:
    """
    Get singleton instance of RAG Engine
    
    Returns:
        RAGEngine instance
    """
    global rag_engine
    if rag_engine is None:
        rag_engine = RAGEngine()
    return rag_engine