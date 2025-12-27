"""
app/routes/rag_chat.py - RAG-powered mental wellness chatbot
Handles educational mental health queries with safety boundaries
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Dict, Optional
import logging
import os
import httpx
from ..ai_engine.rag_engine import get_rag_engine
from ..core.security import get_current_user_id

logger = logging.getLogger(__name__)
router = APIRouter()


class ChatMessage(BaseModel):
    """Request model for chat messages"""
    message: str
    user_id: Optional[str] = None  # Will be populated from auth


class ChatResponse(BaseModel):
    """Response model for chat messages"""
    response: str
    sources: List[Dict]
    timestamp: str
    message_type: str  # 'educational', 'resource', 'escalation'


class CrisisDetectionResponse(BaseModel):
    """Response model for crisis detection"""
    is_crisis: bool
    message: str
    resources: List[str]


def detect_crisis_keywords(message: str) -> bool:
    """
    Rule-based crisis detection - separate from RAG pipeline
    This function identifies crisis-related keywords and phrases
    
    Args:
        message: User message to check
        
    Returns:
        True if crisis-related content detected, False otherwise
    """
    crisis_keywords = [
        "suicidal", "suicide", "kill myself", "want to die", "end my life",
        "hurt myself", "harm myself", "no point living", "better off dead",
        "crisis", "emergency", "urgent help", "immediate help",
        "feeling hopeless", "can't go on", "don't want to live",
        "self-harm", "cutting", "overdose", "hurt someone"
    ]
    
    message_lower = message.lower()
    for keyword in crisis_keywords:
        if keyword in message_lower:
            return True
    
    return False


def get_crisis_resources() -> List[str]:
    """
    Get crisis resources for emergency situations
    
    Returns:
        List of crisis resource contacts
    """
    return [
        "988 Suicide & Crisis Lifeline: Call or text 988",
        "National Suicide Prevention Lifeline: 988 or 1-800-273-8255",
        "Crisis Text Line: Text HOME to 741741",
        "Emergency Services: Call 911 if in immediate danger"
    ]


async def generate_ai_response(context: str, user_message: str) -> str:
    """
    Generate AI response using the retrieved context
    
    Args:
        context: Retrieved context from knowledge base
        user_message: User's original message
        
    Returns:
        Generated response string
    """
    # Check if we have an AI API key configured
    ai_api_key = os.getenv("OPENAI_API_KEY") or os.getenv("ANTHROPIC_API_KEY")
    
    if not ai_api_key:
        # Fallback response if no AI API is configured
        return (
            "Based on mental health education resources:\n\n" +
            context +
            "\n\nThis information is for educational purposes only and should not replace "
            "professional mental health care. Please consult with a qualified mental health "
            "professional for personalized guidance and support."
        )
    
    # Determine which AI provider to use based on available keys
    if os.getenv("OPENAI_API_KEY"):
        return await generate_openai_response(context, user_message)
    elif os.getenv("ANTHROPIC_API_KEY"):
        return await generate_anthropic_response(context, user_message)
    else:
        # Fallback to simple concatenation if no AI API configured
        return (
            "Based on mental health education resources:\n\n" +
            context +
            "\n\nThis information is for educational purposes only and should not replace "
            "professional mental health care. Please consult with a qualified mental health "
            "professional for personalized guidance and support."
        )


async def generate_openai_response(context: str, user_message: str) -> str:
    """
    Generate response using OpenAI API
    """
    try:
        headers = {
            "Authorization": f"Bearer {os.getenv('OPENAI_API_KEY')}",
            "Content-Type": "application/json"
        }
        
        prompt = f"""You are a mental wellness assistant providing educational information only. \n\nContext from knowledge base:\n{context}\n\nUser question: {user_message}\n\nPlease provide a helpful, empathetic response based on the context.\n\nImportant: This is for educational purposes only and not a substitute for professional help."""
        
        data = {
            "model": "gpt-3.5-turbo",
            "messages": [
                {"role": "system", "content": "You are a mental wellness assistant providing educational information only. Your responses should be helpful, empathetic, and grounded in the provided context. Emphasize that this is for educational purposes only and not a substitute for professional help."},
                {"role": "user", "content": prompt}
            ],
            "max_tokens": 500,
            "temperature": 0.7
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers=headers,
                json=data
            )
            
            if response.status_code == 200:
                result = response.json()
                return result['choices'][0]['message']['content'].strip()
            else:
                # Fallback if API call fails
                return (
                    "Based on mental health education resources:\n\n" +
                    context +
                    "\n\nThis information is for educational purposes only and should not replace "
                    "professional mental health care. Please consult with a qualified mental health "
                    "professional for personalized guidance and support."
                )
    except Exception as e:
        logger.error(f"OpenAI API error: {str(e)}")
        # Fallback response
        return (
            "Based on mental health education resources:\n\n" +
            context +
            "\n\nThis information is for educational purposes only and should not replace "
            "professional mental health care. Please consult with a qualified mental health "
            "professional for personalized guidance and support."
        )


async def generate_anthropic_response(context: str, user_message: str) -> str:
    """
    Generate response using Anthropic API
    """
    try:
        headers = {
            "x-api-key": os.getenv('ANTHROPIC_API_KEY'),
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01"
        }
        
        prompt = f"""\n\nHuman: You are a mental wellness assistant providing educational information only. \n\nContext from knowledge base:\n{context}\n\nUser question: {user_message}\n\nPlease provide a helpful, empathetic response based on the context.\n\nImportant: This is for educational purposes only and not a substitute for professional help.\n\nAssistant:"""
        
        data = {
            "model": "claude-3-haiku-20240307",
            "prompt": prompt,
            "max_tokens_to_sample": 500,
            "temperature": 0.7
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://api.anthropic.com/v1/complete",
                headers=headers,
                json=data
            )
            
            if response.status_code == 200:
                result = response.json()
                return result['completion'].strip()
            else:
                # Fallback if API call fails
                return (
                    "Based on mental health education resources:\n\n" +
                    context +
                    "\n\nThis information is for educational purposes only and should not replace "
                    "professional mental health care. Please consult with a qualified mental health "
                    "professional for personalized guidance and support."
                )
    except Exception as e:
        logger.error(f"Anthropic API error: {str(e)}")
        # Fallback response
        return (
            "Based on mental health education resources:\n\n" +
            context +
            "\n\nThis information is for educational purposes only and should not replace "
            "professional mental health care. Please consult with a qualified mental health "
            "professional for personalized guidance and support."
        )


@router.post("/chat", response_model=ChatResponse)
async def chat_with_rag(
    chat_message: ChatMessage,
    user_id: str = Depends(get_current_user_id)
):
    """
    Chat endpoint with RAG-powered responses
    Provides educational mental health information grounded in vetted knowledge base
    
    RAG is used EXCLUSIVELY for knowledge retrieval to ground responses in
    vetted psychoeducational content and coping-exercise explanations.
    RAG is NEVER used for decision-making, risk assessment, or clinical judgments.
    """
    message = chat_message.message.strip()
    
    if not message:
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    
    # Rule-based crisis detection (separate from RAG pipeline)
    if detect_crisis_keywords(message):
        logger.warning(f"Crisis detected for user {user_id}: {message[:50]}...")
        
        crisis_resources = get_crisis_resources()
        crisis_message = (
            "I'm really sorry you're feeling this way. This sounds like a crisis situation. "
            "Please reach out for immediate support:\n\n" +
            "\n".join([f"• {resource}" for resource in crisis_resources]) +
            "\n\nRemember, seeking help is a sign of strength, not weakness. "
            "Trained professionals are available 24/7 to support you through this difficult time."
        )
        
        return ChatResponse(
            response=crisis_message,
            sources=[],
            timestamp=__import__('datetime').datetime.utcnow().isoformat(),
            message_type="escalation"
        )
    
    # Check if query is appropriate for RAG (non-clinical, educational)
    rag = get_rag_engine()
    if not rag.is_query_appropriate(message):
        return ChatResponse(
            response=(
                "I understand you're looking for mental health information. "
                "I can provide educational content about mental health topics and coping strategies. "
                "However, I'm not able to provide clinical assessments or personalized treatment advice. "
                "For personalized guidance, please consult with a mental health professional."
            ),
            sources=[],
            timestamp=__import__('datetime').datetime.utcnow().isoformat(),
            message_type="educational"
        )
    
    try:
        # Get context from RAG engine
        context = rag.get_context_for_prompt(message)
        
        if "I don't have specific information" in context:
            # No relevant information found in knowledge base
            response = (
                "I don't have specific information about this topic in my knowledge base. "
                "For personalized mental health guidance, please consult with a qualified mental health professional. "
                "If you're in crisis, please reach out to emergency services or crisis hotlines."
            )
            
            return ChatResponse(
                response=response,
                sources=[],
                timestamp=__import__('datetime').datetime.utcnow().isoformat(),
                message_type="resource"
            )
        
        # Generate AI response based on retrieved context
        response = await generate_ai_response(context, message)
        
        # Extract sources from the context (top-k results from RAG)
        sources = rag.search(message, top_k=3)
        
        logger.info(f"RAG chat response generated for user {user_id}")
        
        return ChatResponse(
            response=response,
            sources=sources,
            timestamp=__import__('datetime').datetime.utcnow().isoformat(),
            message_type="educational"
        )
    
    except Exception as e:
        logger.error(f"Error in RAG chat: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="An error occurred while processing your request"
        )


@router.post("/search-knowledge", response_model=List[Dict])
async def search_knowledge_base(
    chat_message: ChatMessage,
    user_id: str = Depends(get_current_user_id)
):
    """
    Search the knowledge base directly
    Allows users to search for specific mental health information
    
    RAG is used EXCLUSIVELY for knowledge retrieval to ground responses in
    vetted psychoeducational content and coping-exercise explanations.
    """
    message = chat_message.message.strip()
    
    if not message:
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    
    try:
        rag = get_rag_engine()
        results = rag.search(message, top_k=5)
        
        logger.info(f"Knowledge base search performed by user {user_id}: {message[:50]}...")
        
        return results
    
    except Exception as e:
        logger.error(f"Error in knowledge base search: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="An error occurred while searching the knowledge base"
        )


@router.get("/available-topics")
async def get_available_topics(user_id: str = Depends(get_current_user_id)):
    """
    Get available mental health topics in the knowledge base
    Provides users with a list of topics they can ask about
    """
    try:
        rag = get_rag_engine()
        
        # Get all unique categories and some sample topics
        categories = {}
        for entry in rag.knowledge_base:
            category = entry['category']
            if category not in categories:
                categories[category] = []
            categories[category].append({
                'id': entry['id'],
                'title': entry['title'],
                'tags': entry['tags'][:3]  # First 3 tags
            })
        
        logger.info(f"Available topics retrieved for user {user_id}")
        
        return {
            "categories": categories,
            "total_entries": len(rag.knowledge_base)
        }
    
    except Exception as e:
        logger.error(f"Error retrieving available topics: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="An error occurred while retrieving available topics"
        )