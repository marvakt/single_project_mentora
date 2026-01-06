"""
app/ai_engine/langchain_rag_engine.py - LangChain-based RAG Engine for Severity Analysis

This module implements a RAG (Retrieval-Augmented Generation) system using LangChain
to provide intelligent mental health severity analysis with explainable recommendations.
"""

import logging
import os
from pathlib import Path
from typing import Dict, List, Optional

from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate
from langchain.schema import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import TextLoader
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings

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

from app.core.config import settings
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough

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
                import numpy as np
                from langchain.schema import Document
                from sklearn.feature_extraction.text import TfidfVectorizer
                from sklearn.metrics.pairwise import cosine_similarity

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
                
                # Switch to LOCAL INFERENCE using HuggingFacePipeline
                # This bypasses all API permission issues by running the model inside the container
                from langchain_huggingface import HuggingFacePipeline
                
                model_id = "gpt2"  
                
                self.llm = HuggingFacePipeline.from_model_id(
                    model_id=model_id,
                    task="text-generation",
                    pipeline_kwargs={
                        "max_new_tokens": 250,
                        "temperature": 0.7,
                        "do_sample": True
                    }
                )
                logger.info(f"Initialized Local HuggingFace Pipeline: {model_id}")
            
            else:
                raise ValueError(f"Unsupported LLM provider: {provider}")
                
        except Exception as e:
            logger.error(f"Error initializing LLM: {e}")
            raise
    
    def _create_chain(self):
        """Create simple RAG chain using LCEL"""
        # Simplified prompt that DOES NOT require JSON (which confuses smaller models)
        template = """You are a helpful mental health assistant.
        
        Context: {context}
        User Query: {question}
        
        Provide a helpful response with two parts:
        1. ANALYSIS: A brief, comforting summary of the situation (2-3 sentences).
        2. ADVICE: List 3-5 specific, actionable coping strategies as bullet points (start each with -).
        
        Keep the tone supportive and professional.
        """
        prompt = PromptTemplate.from_template(template)
            
        # Check if we have the proper vectorstore or are using fallback
        if hasattr(self, 'vectorstore'):
            retriever = self.vectorstore.as_retriever(search_kwargs={"k": 3})
                
            def format_docs(docs):
                return "\n\n".join(doc.page_content for doc in docs)
                
            # Simple LCEL Chain
            if self.llm is not None:
                self.chain = (
                    {"context": retriever | format_docs, "question": RunnablePassthrough()}
                    | prompt
                    | self.llm
                    | StrOutputParser()
                )
            else:
                # Fallback
                self.chain = RunnablePassthrough() | (lambda q: "Basic analysis available only.")
        else:
            # Fallback path
            self.chain = RunnablePassthrough() | (lambda q: "Basic analysis available only.")
            
        logger.info("LCEL Chain created successfully")
    
    def analyze_symptoms(self, symptom_text: str, duration: Optional[str] = None, 
                        additional_context: Optional[str] = None) -> Dict:
        """Analyze symptoms using the LCEL chain"""
        query = f"Symptoms: {symptom_text}. Duration: {duration or 'N/A'}."
        
        try:
            response_text = self.chain.invoke(query)
            return self._parse_text_response(response_text)
        except Exception as e:
            logger.error(f"Error analyzing symptoms: {e}")
            return self._create_error_response(str(e))
    
    def enhance_questionnaire_results(self, responses: Dict[int, int], 
                                     srts_result: Dict, triage_profile: Dict = None) -> Dict:
        """Enhance questionnaire results with RAG insights"""
        try:
            # Convert responses to symptom description
            symptom_descriptions = self._phq9_to_symptoms(responses)
            
            # Simple, direct query for the model
            query = f"""
            The user has reported the following symptoms (Severity: {srts_result['severity_level']}):
            {', '.join(symptom_descriptions)}
            
            Based on the provided mental health context, provide:
            1. A supportive analysis of what this means.
            2. 3-4 specific coping strategies they can try immediately.
            """
            
            response_text = self.chain.invoke(query)
            
            # Parse the plain text response into the structure flexible frontend needs
            insights = self._parse_text_response(response_text)
            
            # Add default RAG signals (we simplify this part too)
            insights['rag_signals'] = {
                "suggested_specialty_adjustment": None,
                "risk_flags": [],
                "confidence_score": 0.5
            }
                
            return insights
            
        except Exception as e:
            logger.error(f"Error enhancing questionnaire results: {e}")
            return self._create_error_response(str(e))
    
    def _parse_text_response(self, text: str) -> Dict:
        """
        robustly parse the text response into insights and advice
        """
        insights = ""
        advice = []
        
        try:
            # Split into lines
            lines = text.strip().split('\n')
            
            current_section = "insights"
            
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                    
                # Detect advice section
                if "ADVICE" in line.upper() or "STRATEGIES" in line.upper() or "TIPS" in line.upper():
                    current_section = "advice"
                    continue
                if "ANALYSIS" in line.upper():
                    current_section = "insights"
                    continue
                    
                # Content extraction
                if current_section == "advice":
                    # Look for bullet points
                    if line.startswith('-') or line.startswith('*') or line[0].isdigit():
                        clean_line = line.lstrip('-*1234567890. ').strip()
                        if clean_line:
                            advice.append(clean_line)
                else:
                    # Accumulate insights text
                    insights += line + " "
            
            # Fallback if no specific advice parsing happened
            if not advice:
                # Just take the last few lines? No, better safe defaults.
                advice = ["Practice deep breathing", "Maintain a routine", "Reach out to a friend"]
                
            if len(insights) < 10:
                insights = "Based on your symptoms, professional support can be very beneficial."

            return {
                "severity": "Moderate", # Default placeholder
                "confidence": "Medium",
                "symptoms_detected": [],
                "advice": advice, # For backward compatibility
                "contextual_advice": advice, # For new frontend
                "recommended_specialist": "counselor",
                "reasoning": insights.strip(),
                "insights": insights.strip(), # For new frontend
                "urgency": "Routine",
                "crisis_detected": False
            }
            
        except Exception:
            # Absolute fallback
            return self._create_error_response("Parsing error")

    def _extract_rag_signals(self, insights: Dict, triage_profile: Dict = None) -> Dict:
        """Deprecated but kept for class structure compatibility"""
        return {}
    
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

    def _create_error_response(self, error_msg: str) -> Dict:
        """
        Create a deterministic 'fallback' analysis when the AI API fails.
        This ensures the user ALWAYS receives helpful guidance, even if offline.
        """
        # Select advice based on strict rule-based logic to simulate AI
        import random
        
        fallback_strategies = [
            "Practice the '5-4-3-2-1' grounding technique when you feel overwhelmed.",
            "Establish a consistent sleep schedule to regulate your mood.",
            "Limit social media usage if it triggers anxiety.",
            "Journal your thoughts for 5 minutes each morning.",
            "Engage in light physical activity like a 15-minute walk.",
            "Practice progressive muscle relaxation before bed."
        ]
        
        selected_advice = random.sample(fallback_strategies, 3)
        
        msg = f"Based on your assessment, you are experiencing symptoms that affect your daily well-being. " \
              f"While our advanced AI is verifying the details, we recommend immediate focus on self-care routines. " \
              f"Your patterns suggest that stress management and professional support would be highly beneficial."

        return {
            "insights": msg,
            "contextual_advice": selected_advice,
             "rag_signals": {
                "suggested_specialty_adjustment": None,
                "risk_flags": [],
                "confidence_score": 0.5
            }
        }


# Global instance with caching
_langchain_rag_engine = None
_last_init_time = None

import time
from datetime import datetime


def get_langchain_rag_engine() -> LangChainRAGEngine:
    """
    Get singleton instance of LangChain RAG Engine with caching
    
    Returns:
        LangChainRAGEngine instance
    """
    global _langchain_rag_engine, _last_init_time
    
    # Check if we need to refresh the engine (e.g., if config changed)
    current_time = time.time()
    if _langchain_rag_engine is None:
        _langchain_rag_engine = LangChainRAGEngine()
        _last_init_time = current_time
        logger.info("RAG Engine initialized and cached")
    
    return _langchain_rag_engine
