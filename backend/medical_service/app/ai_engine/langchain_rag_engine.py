"""
app/ai_engine/langchain_rag_engine.py - LangChain-based RAG Engine for Severity Analysis

This module implements a RAG (Retrieval-Augmented Generation) system using LangChain
to provide intelligent mental health severity analysis with explainable recommendations.
"""

import os
import logging
from typing import Dict, List, Optional
from pathlib import Path

from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import TextLoader
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate
from langchain.schema import Document

# Import LLM based on provider
try:
    from langchain_openai import ChatOpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

try:
    from langchain_huggingface import HuggingFaceEndpoint
    HUGGINGFACE_AVAILABLE = True
except ImportError:
    HUGGINGFACE_AVAILABLE = False

from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser

from app.core.config import settings

logger = logging.getLogger(__name__)


class LangChainRAGEngine:
    """
    Simplified LangChain-based RAG Engine for mental health severity analysis.
    Uses FAISS for retrieval and LCEL (LangChain Expression Language) for the chain.
    """
    
    def __init__(self):
        """Initialize RAG engine with knowledge base and LLM"""
        self.knowledge_base_path = Path(__file__).parent.parent / "knowledge_base"
        self.vectorstore = None
        self.llm = None
        self.chain = None
        
        # Initialize components
        self._load_knowledge_base()
        self._initialize_llm()
        self._create_chain()
        
        logger.info("LangChain RAG Engine (Simplified) initialized successfully")
    
    def _load_knowledge_base(self):
        """Load and vectorize knowledge base documents"""
        try:
            documents = []
            
            # Load all text files from knowledge base
            knowledge_files = [
                "severity_guidelines.txt",
                "coping_strategies.txt",
                "doctor_specializations.txt",
                "warning_signs.txt"
            ]
            
            for filename in knowledge_files:
                file_path = self.knowledge_base_path / filename
                if file_path.exists():
                    loader = TextLoader(str(file_path), encoding='utf-8')
                    docs = loader.load()
                    
                    # Add metadata
                    for doc in docs:
                        doc.metadata['source'] = filename
                    
                    documents.extend(docs)
                    logger.info(f"Loaded {filename}: {len(docs)} documents")
                else:
                    logger.warning(f"Knowledge base file not found: {filename}")
            
            if not documents:
                raise ValueError("No knowledge base documents loaded")
            
            # Split documents into chunks
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=800,
                chunk_overlap=100,
                length_function=len,
            )
            split_docs = text_splitter.split_documents(documents)
            logger.info(f"Split into {len(split_docs)} chunks")
            
            # Create a simple in-memory vector store using basic embeddings to avoid PyTorch compatibility issues
            try:
                from langchain_huggingface import HuggingFaceEmbeddings
                embeddings = HuggingFaceEmbeddings(
                    model_name="sentence-transformers/all-MiniLM-L6-v2"
                )
                self.vectorstore = FAISS.from_documents(split_docs, embeddings)
            except Exception as e:
                logger.warning(f"HuggingFaceEmbeddings failed: {e}. Using basic in-memory fallback.")
                # Fallback to basic in-memory similarity search
                from langchain.schema import Document
                from sklearn.feature_extraction.text import TfidfVectorizer
                from sklearn.metrics.pairwise import cosine_similarity
                import numpy as np
                        
                # Store documents for similarity search
                self.documents = split_docs
                self.vectorizer = TfidfVectorizer(stop_words='english')
                        
                # Fit the vectorizer on document content
                doc_texts = [doc.page_content for doc in split_docs]
                self.doc_vectors = self.vectorizer.fit_transform(doc_texts)
                        
                logger.info("Created basic in-memory vector store as fallback")
                return  # Early return to skip the rest of initialization that requires FAISS
            logger.info(f"Created FAISS vector store with {len(split_docs)} documents")
            
        except Exception as e:
            logger.error(f"Error loading knowledge base: {e}")
            raise
    
    def _initialize_llm(self):
        """Initialize LLM based on configuration"""
        try:
            provider = settings.LLM_PROVIDER.lower()
            
            if provider == "openai":
                if not OPENAI_AVAILABLE:
                    raise ImportError("langchain-openai not installed")
                
                if not settings.OPENAI_API_KEY:
                    raise ValueError("OPENAI_API_KEY not configured")
                
                self.llm = ChatOpenAI(
                    model=settings.LLM_MODEL,
                    temperature=settings.LLM_TEMPERATURE,
                    openai_api_key=settings.OPENAI_API_KEY
                )
                logger.info(f"Initialized OpenAI LLM: {settings.LLM_MODEL}")
                
            elif provider == "huggingface":
                if not HUGGINGFACE_AVAILABLE:
                    raise ImportError("HuggingFace integration not available")
                
                if not settings.HUGGINGFACE_API_KEY:
                    logger.warning("HUGGINGFACE_API_KEY not configured, using local models only")
                    # Fall back to local models only instead of raising error
                    self.llm = None
                    return  # Skip LLM initialization when API key is missing
                
                self.llm = HuggingFaceEndpoint(
                    repo_id=settings.LLM_MODEL,
                    huggingfacehub_api_token=settings.HUGGINGFACE_API_KEY,
                    temperature=settings.LLM_TEMPERATURE,
                    max_new_tokens=512
                )
                logger.info(f"Initialized HuggingFace LLM: {settings.LLM_MODEL}")
            
            else:
                raise ValueError(f"Unsupported LLM provider: {provider}")
                
        except Exception as e:
            logger.error(f"Error initializing LLM: {e}")
            raise
    
    def _create_chain(self):
        """Create simple RAG chain using LCEL"""
        template = """You are a mental health assessment assistant. Use the context below to analyze the user's symptoms.
            
        Context: {context}
        User Query: {question}
            
        Provide a detailed assessment in VALID JSON format ONLY:
        { {
          "severity": "Mild|Moderate|Severe",
          "confidence": "High|Medium|Low",
          "symptoms_detected": [list],
          "advice": [3-5 coping strategies],
          "recommended_specialist": "counselor|psychologist|psychiatrist",
          "reasoning": "explanation",
          "urgency": "Routine|Immediate",
          "crisis_detected": boolean
        } }
        """
        prompt = PromptTemplate.from_template(template)
            
        # Check if we have the proper vectorstore or are using fallback
        if hasattr(self, 'vectorstore'):
            retriever = self.vectorstore.as_retriever(search_kwargs={"k": 3})
                
            def format_docs(docs):
                return "\n\n".join(doc.page_content for doc in docs)
                
            # Simple LCEL Chain for normal case
            if self.llm is not None:
                self.chain = (
                    {"context": retriever | format_docs, "question": RunnablePassthrough()}
                    | prompt
                    | self.llm
                    | StrOutputParser()
                )
            else:
                # Fallback to basic response when no LLM is available (API key missing)
                def format_query_for_basic_response(query):
                    context_docs = retriever.get_relevant_documents(query)
                    context = format_docs(context_docs)
                    return f"Context: {context}\n\nUser Query: {query}\n\nBased on the context provided, here is a basic assessment:"
                self.chain = RunnablePassthrough() | format_query_for_basic_response
        else:
            # Fallback chain that uses basic similarity search
            def get_context(query):
                # Transform the query using the fitted vectorizer
                query_vector = self.vectorizer.transform([query])
                # Calculate cosine similarity
                similarities = cosine_similarity(query_vector, self.doc_vectors).flatten()
                # Get top 3 most similar documents
                top_indices = similarities.argsort()[-3:][::-1]
                context = "\n\n".join([self.documents[i].page_content for i in top_indices if similarities[i] > 0.1])  # threshold to avoid irrelevant matches
                return context
                
            def format_query_for_llm(query):
                context = get_context(query)
                return {"context": context, "question": query}
                
            # Create fallback chain
            if self.llm is not None:
                self.chain = (
                    RunnablePassthrough() | format_query_for_llm | prompt
                    | self.llm
                    | StrOutputParser()
                )
            else:
                # Fallback to basic response when no LLM is available (API key missing)
                def format_query_for_basic_response(query):
                    context = get_context(query)
                    return f"Context: {context}\n\nUser Query: {query}\n\nBased on the context provided, here is a basic assessment:"
                self.chain = RunnablePassthrough() | format_query_for_basic_response
            
        logger.info("LCEL Chain created successfully")
    
    def analyze_symptoms(self, symptom_text: str, duration: Optional[str] = None, 
                        additional_context: Optional[str] = None) -> Dict:
        """Analyze symptoms using the LCEL chain"""
        try:
            # Build query
            query = f"Symptoms: {symptom_text}. Duration: {duration or 'N/A'}. Context: {additional_context or 'N/A'}"
            
            logger.info(f"Analyzing symptoms: {symptom_text[:100]}...")
            
            # Run RAG chain
            response_text = self.chain.invoke(query)
            
            # Parse response
            # Extract JSON from response (handle potential markdown formatting)
            import json
            import re
            
            # Try to find JSON in response
            json_match = re.search(r'\{[\s\S]*\}', response_text)
            if json_match:
                analysis = json.loads(json_match.group())
            elif self.llm is None and "basic assessment" in response_text.lower():
                # Handle the basic response case when no LLM is available
                analysis = {
                    "severity": "Mild",
                    "confidence": "Low",
                    "symptoms_detected": ["Basic assessment - no advanced AI processing available"],
                    "advice": [
                        "Consider consulting with a mental health professional for personalized assessment",
                        "Keep track of your symptoms",
                        "Practice basic self-care strategies"
                    ],
                    "recommended_specialist": "counselor",
                    "reasoning": "Basic assessment provided when advanced AI processing is not available",
                    "urgency": "Routine",
                    "crisis_detected": False
                }
            else:
                # Fallback: create structured response from text
                logger.warning("Could not parse JSON from LLM response, using fallback")
                analysis = self._create_fallback_response(response_text)
            
            # Add metadata
            # Note: LCEL chain doesn't directly return source_documents in the same way as RetrievalQA
            # If sources are needed, the chain structure would need to be modified to pass them through.
            analysis["raw_response"] = response_text
            
            logger.info(f"Analysis complete: Severity={analysis.get('severity')}, Specialist={analysis.get('recommended_specialist')}")
            
            return analysis
            
        except Exception as e:
            logger.error(f"Error analyzing symptoms: {e}")
            return self._create_error_response(str(e))
    
    def enhance_questionnaire_results(self, responses: Dict[int, int], 
                                     srts_result: Dict) -> Dict:
        """
        Enhance PHQ-9 questionnaire results with RAG-generated insights
        
        Args:
            responses: Dictionary of PHQ-9 responses {question_number: score}
            srts_result: SRTS severity calculation result
        
        Returns:
            Dictionary with enhanced recommendations and insights
        """
        try:
            # Convert responses to symptom description
            symptom_descriptions = self._phq9_to_symptoms(responses)
            
            query = f"""
            PHQ-9 Questionnaire Results:
            - Total Score: {srts_result['raw_score']}
            - SRTS Severity Level: {srts_result['severity_level']}
            - Detected Symptoms: {', '.join(symptom_descriptions)}
            
            Provide enhanced recommendations and insights based on these specific symptoms.
            Focus on personalized coping strategies that address the symptoms mentioned.
            Returns VALID JSON ONLY.
            """
            
            response_text = self.chain.invoke(query)
            
            # Parse and return insights
            import json
            import re
            
            json_match = re.search(r'\{[\s\S]*\}', response_text)
            if json_match:
                insights = json.loads(json_match.group())
            elif self.llm is None and "basic assessment" in response_text.lower():
                # Handle the basic response case when no LLM is available
                insights = {
                    "contextual_advice": [
                        "Consider consulting with a mental health professional for personalized assessment",
                        "Keep track of your symptoms",
                        "Practice basic self-care strategies"
                    ],
                    "insights": "Basic insights provided when advanced AI processing is not available. Professional support is recommended based on your questionnaire responses."
                }
            else:
                insights = {
                    "contextual_advice": [response_text],
                    "insights": "Based on your responses, professional support is recommended."
                }
            
            return insights
            
        except Exception as e:
            logger.error(f"Error enhancing questionnaire results: {e}")
            return {
                "contextual_advice": [],
                "insights": "Unable to generate enhanced insights at this time."
            }
    
    def _phq9_to_symptoms(self, responses: Dict[int, int]) -> List[str]:
        """Convert PHQ-9 responses to symptom descriptions"""
        symptom_map = {
            1: "loss of interest or pleasure",
            2: "depressed mood",
            3: "sleep disturbances",
            4: "fatigue or low energy",
            5: "appetite changes",
            6: "feelings of worthlessness",
            7: "concentration difficulties",
            8: "psychomotor changes",
            9: "thoughts of self-harm",
            10: "functional impairment"
        }
        
        symptoms = []
        for q_num, score in responses.items():
            if score >= 2:  # Moderate to severe symptom
                symptoms.append(symptom_map.get(q_num, f"symptom {q_num}"))
        
        return symptoms
    
    def _create_fallback_response(self, response_text: str) -> Dict:
        """Create fallback response when JSON parsing fails"""
        return {
            "severity": "Moderate",
            "confidence": "Low",
            "symptoms_detected": ["Unable to parse symptoms"],
            "advice": [
                "Please consult with a mental health professional for proper assessment",
                "Consider keeping a symptom journal",
                "Practice self-care and reach out to support systems"
            ],
            "recommended_specialist": "psychologist",
            "reasoning": response_text[:500],
            "urgency": "Within 1 week",
            "crisis_detected": False
        }
    
    def _create_error_response(self, error_msg: str) -> Dict:
        """Create error response"""
        return {
            "severity": "Unknown",
            "confidence": "Low",
            "symptoms_detected": [],
            "advice": [
                "An error occurred during analysis",
                "Please try again or consult with a mental health professional directly"
            ],
            "recommended_specialist": "psychologist",
            "reasoning": f"Error: {error_msg}",
            "urgency": "Routine",
            "crisis_detected": False,
            "error": error_msg
        }


# Global instance
_langchain_rag_engine = None


def get_langchain_rag_engine() -> LangChainRAGEngine:
    """
    Get singleton instance of LangChain RAG Engine
    
    Returns:
        LangChainRAGEngine instance
    """
    global _langchain_rag_engine
    if _langchain_rag_engine is None:
        _langchain_rag_engine = LangChainRAGEngine()
    return _langchain_rag_engine
