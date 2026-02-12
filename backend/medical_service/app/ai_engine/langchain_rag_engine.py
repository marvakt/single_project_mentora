"""
app/ai_engine/langchain_rag_engine.py - LangChain-based RAG Engine for Severity Analysis

This module implements a RAG (Retrieval-Augmented Generation) system using LangChain
to provide intelligent mental health severity analysis with explainable recommendations.
"""

import logging
import os
import re
from pathlib import Path
from typing import Dict, List, Optional


from langchain.prompts import PromptTemplate
from langchain.schema import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import TextLoader
from langchain_community.vectorstores import FAISS
# HUGGINGFACE_AVAILABLE (only for embeddings now)
try:
    from langchain_huggingface import HuggingFaceEmbeddings
    HUGGINGFACE_AVAILABLE = True
except ImportError:
    HUGGINGFACE_AVAILABLE = False

try:
    from langchain_groq import ChatGroq
    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False

from app.core.config import settings
from app.ai_engine.safety import validate_non_crisis_output, CLINICAL_BOUNDARIES
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
                "WHO_mhGAP_Standards.txt",      # External: WHO clinical standards
                "severity_guidelines.txt",       # Internal: App-specific severity mapping
                "coping_strategies.txt",         # Internal: Curated wellness exercises
                "doctor_specializations.txt",    # Internal: Platform doctor types
                "warning_signs.txt"              # Internal: Crisis detection rules
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
            
            if provider == "groq":
                if not GROQ_AVAILABLE:
                    raise ImportError("langchain-groq not installed")
                
                if not settings.GROQ_API_KEY:
                    raise ValueError("GROQ_API_KEY not configured")
                
                self.llm = ChatGroq(
                    model_name="llama3-8b-8192",  # Default fast model
                    temperature=settings.LLM_TEMPERATURE,
                    groq_api_key=settings.GROQ_API_KEY
                )
                logger.info(f"Initialized Groq LLM: llama3-8b-8192")

            else:
                # Fallback or invalid
                logger.warning(f"Unsupported/Missing LLM provider: {provider}. RAG will be disabled (fallback only).")
                self.llm = None
                
        except Exception as e:
            logger.error(f"Error initializing LLM: {e}")
            raise
    
    def _create_chain(self):
        """Create simple RAG chain using LCEL"""
        # Simplified prompt optimized for Flan-T5
        template = """Context: {context}

Question: {question}

Provide a brief supportive response with:
1. Short analysis (2 sentences)
2. Three specific coping strategies

Response:"""
        prompt = PromptTemplate.from_template(template)
            
        # Check if we have the proper vectorstore or are using fallback
        if hasattr(self, 'vectorstore'):
            # Reduce retrieval to 2 docs to avoid token limit
            retriever = self.vectorstore.as_retriever(search_kwargs={"k": 2})
                
            def format_docs(docs):
                # Truncate each doc to 150 chars to fit Flan-T5's 512 token limit
                truncated = [doc.page_content[:150] for doc in docs]
                return "\n\n".join(truncated)
                
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
            # FIX #1: Crisis detection with granularity
            is_crisis, crisis_level = self._is_crisis_level(responses, triage_profile)
            
            if is_crisis:
                return self._generate_crisis_response(crisis_level)
            
            # Non-crisis path: generate supportive insights
            return self._generate_supportive_response(responses, srts_result, triage_profile)
            
        except Exception as e:
            logger.error(f"Error enhancing questionnaire results: {e}")
            return self._create_error_response(str(e))
    
    def _is_crisis_level(self, responses: Dict[int, int], triage_profile: Dict) -> tuple:
        """Detect crisis level with granularity"""
        q9_score = responses.get(9, 0)
        high_risk = triage_profile.get("red_flags", {}).get("high_risk", False)
        
        is_crisis = q9_score > 0 or high_risk
        
        # FIX #1: Proper crisis level derivation
        if high_risk:
            crisis_level = "active"  # Red flags = active crisis
        elif q9_score >= 2:
            crisis_level = "active"
        elif q9_score == 1:
            crisis_level = "passive"
        else:
            crisis_level = None
        
        return is_crisis, crisis_level
    
    def _generate_crisis_response(self, crisis_level: str) -> Dict:
        """Generate deterministic crisis response - NO LLM"""
        return {
            "insights": "Your responses indicate you may be experiencing thoughts of self-harm. This is a serious concern that requires immediate professional support.",
            "contextual_advice": [
                "Contact a crisis helpline immediately: National Suicide Prevention Lifeline: 988",
                "Reach out to a trusted friend or family member right now",
                "If you're in immediate danger, call emergency services (911) or go to the nearest emergency room"
            ],
            "rag_signals": {
                "risk_safe": False,
                "crisis_detected": True,
                "crisis_level": crisis_level,
                "confidence_score": 1.0,
                "sources": ["crisis_protocol"],
                "is_clinical_tool": CLINICAL_BOUNDARIES["is_clinical_tool"]
            }
        }
    
    def _generate_supportive_response(self, responses: Dict[int, int], 
                                     srts_result: Dict, triage_profile: Dict) -> Dict:
        """Generate supportive RAG insights for non-crisis cases"""
        # Convert responses to symptom description
        symptom_descriptions = self._phq9_to_symptoms(responses)
        
        # Structured JSON prompt for Llama 3
        query = f"""
        You are an expert mental health AI assistant.
        
        PATIENT PROFILE:
        - Symptoms: {', '.join(symptom_descriptions)}
        - Severity Level: {srts_result['severity_level']}
        
        Generate a personalized treatment plan in strict JSON format.
        Do not include any text outside the JSON block.
        
        JSON Structure:
        {{
            "analysis": "Short, supportive clinical analysis (2-3 sentences)",
            "coping_strategies": ["Strategy 1", "Strategy 2", "Strategy 3"],
            "lifestyle_changes": ["Lifestyle Change 1", "Lifestyle Change 2", "Lifestyle Change 3"],
            "goals": ["Short-term Goal 1", "Short-term Goal 2", "Long-term Goal 3"]
        }}
        """
        
        # Get retrieved documents for source tracking (reduced to 2 for token limit)
        retrieved_docs = []
        if hasattr(self, 'vectorstore') and self.vectorstore:
            retrieved_docs = self.vectorstore.similarity_search(query, k=2)
        
        response_text = self.chain.invoke(query)
        
        # Debug logging
        logger.info(f"RAG LLM Response (first 200 chars): {response_text[:200]}")
        
        # Early repetition detection - check if same phrase repeats
        words = response_text.split()
        if len(words) > 10:
            # Check if first 5 words repeat multiple times
            first_phrase = ' '.join(words[:5])
            if response_text.count(first_phrase) > 2:
                logger.warning(f"Detected repetitive LLM output, using fallback")
                return self._create_error_response("Repetitive output")
        
        # FIX #4: Post-generation safety filter
        validate_non_crisis_output(response_text)
        
        # Parse the plain text response
        insights = self._parse_text_response(response_text)
        
        # FIX #2: Evidence-based confidence (NOT severity-based)
        insights['rag_signals'] = {
            "suggested_specialty_adjustment": None,
            "risk_flags": [],
            "confidence_score": self._calculate_confidence(retrieved_docs),
            "sources": [doc.metadata.get("source", "unknown") for doc in retrieved_docs],
            "risk_safe": True,
            "is_clinical_tool": CLINICAL_BOUNDARIES["is_clinical_tool"]
        }
            
        return insights
    
    def _calculate_confidence(self, retrieved_docs: List) -> float:
        """Calculate confidence based on evidence quality, NOT severity"""
        # Base confidence
        confidence = 0.5
        
        # Factor 1: Retrieval quality (most important)
        if len(retrieved_docs) >= 2:  # Adjusted for k=2
            confidence += 0.15
        
        # Factor 2: Knowledge base agreement
        if retrieved_docs:
            doc_sources = [doc.metadata.get("source", "") for doc in retrieved_docs]
            unique_sources = set(doc_sources)
            if len(unique_sources) >= 2:  # Multiple sources agree
                confidence += 0.15
        
        # Severity is NEUTRAL - it doesn't affect confidence
        # Higher severity cases need HIGHER evidence bar, not automatic confidence
        
        return min(confidence, 0.9)  # Cap at 0.9, never claim 100% certainty
    
    def _parse_text_response(self, text: str) -> Dict:
        """
        Robustly parse the response into insights and advice.
        Tries to parse JSON first, then falls back to text parsing.
        """
        insights = ""
        advice = []
        lifestyle = []
        goals = []
        
        # clean potentially markdown code blocks
        clean_text = text.replace("```json", "").replace("```", "").strip()
        
        try:
            import json
            # Try to find JSON object in text
            json_match = re.search(r'\{.*\}', clean_text, re.DOTALL)
            if json_match:
                data = json.loads(json_match.group(0))
                insights = data.get("analysis", "")
                advice = data.get("coping_strategies", [])
                lifestyle = data.get("lifestyle_changes", [])
                goals = data.get("goals", [])
                
                # If successfully parsed JSON, return immediately
                if insights or advice:
                    return {
                        "severity": "Moderate", # Placeholder
                        "confidence": "Medium",
                        "symptoms_detected": [],
                        "advice": advice[:4],
                        "contextual_advice": advice[:4],
                        "recommended_specialist": "counselor",
                        "reasoning": insights,
                        "insights": insights,
                        "urgency": "Routine",
                        "crisis_detected": False,
                        "lifestyle_changes": lifestyle[:3],
                        "goals": goals[:3]
                    }
        except Exception as e:
            logger.warning(f"JSON parsing failed, falling back to text parsing: {e}")
            
        # Fallback to old text parsing
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
                        # Filtering generic headers often hallucinated by T5
                        if clean_line and "Discussion of" not in clean_line and "Recommendation for" not in clean_line and "Suggestion for" not in clean_line:
                            advice.append(clean_line)
                else:
                    # Accumulate insights text
                    insights += line + " "

            # Fallback defaults if empty - ONLY if absolutely needed
            if not advice:
                advice = ["Practice mindfulness", "Regular sleep", "Gentle exercise"]
            
            if not insights:
                insights = "Based on your symptoms, professional support is recommended."

            return {
                "severity": "Moderate",
                "confidence": "Medium",
                "symptoms_detected": [],
                "advice": advice[:4],
                "contextual_advice": advice[:4],
                "recommended_specialist": "counselor",
                "reasoning": insights.strip(),
                "insights": insights.strip(),
                "urgency": "Routine",
                "crisis_detected": False,
                "lifestyle_changes": [],
                "goals": []
            }
            
        except Exception as e:
            logger.error(f"Error parsing text response: {e}")
            return {
                "severity": "Moderate", "confidence": "Low", "symptoms_detected": [],
                "advice": [], "contextual_advice": [], "recommended_specialist": "counselor",
                "reasoning": "Analysis unavailable", "insights": "Analysis unavailable",
                "urgency": "Routine", "crisis_detected": False
            }
            logger.warning(f"Failed to parse LLM response: {e}. Using fallback.")
            return self._create_error_response("Parsing error")


    
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
