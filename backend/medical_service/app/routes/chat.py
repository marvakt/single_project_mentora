"""
app/routes/chat.py - Secure Chat System
Doctor-Patient and AI Chatbot communication
"""

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, Field
from typing import Optional, List
from app.core.security import get_current_user_id, get_current_user, decode_jwt
from app.core.database import get_database
from app.core.encryption import encryption, ENCRYPTED_FIELDS
from datetime import datetime
import logging
import json

logger = logging.getLogger(__name__)

router = APIRouter()


# Connection manager for WebSocket
class ConnectionManager:
    def __init__(self):
        self.active_connections: dict = {}
    
    async def connect(self, websocket: WebSocket, room_id: str, user_id: str):
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = {}
        self.active_connections[room_id][user_id] = websocket
        logger.info(f"User {user_id} connected to room {room_id}")
    
    def disconnect(self, room_id: str, user_id: str):
        if room_id in self.active_connections:
            if user_id in self.active_connections[room_id]:
                del self.active_connections[room_id][user_id]
                logger.info(f"User {user_id} disconnected from room {room_id}")
    
    async def send_message(self, message: dict, room_id: str, exclude_user: str = None):
        if room_id in self.active_connections:
            for user_id, connection in self.active_connections[room_id].items():
                if user_id != exclude_user:
                    try:
                        await connection.send_json(message)
                    except Exception as e:
                        logger.error(f"Failed to send message to {user_id}: {e}")


manager = ConnectionManager()


# Request/Response Models
class ChatMessage(BaseModel):
    """Chat message model"""
    room_id: str = Field(..., description="Chat room ID (usually appointment_id)")
    message: str = Field(..., min_length=1, max_length=2000)
    message_type: str = Field(default="text", description="text, image, file")


@router.post("/send")
async def send_chat_message(
    chat_data: ChatMessage,
    user_id: str = Depends(get_current_user_id),
    current_user: dict = Depends(get_current_user)
):
    """
    Send a chat message (REST endpoint)
    
    Stores encrypted message in database
    """
    db = get_database()
    
    # Prepare message document
    message_doc = {
        "room_id": chat_data.room_id,
        "sender_id": user_id,
        "sender_role": current_user.get("role", "user"),
        "message": chat_data.message,
        "message_type": chat_data.message_type,
        "timestamp": datetime.utcnow(),
        "read": False
    }
    
    # Encrypt message
    encrypted_message = encryption.encrypt_dict(
        message_doc,
        ENCRYPTED_FIELDS.get("chat_messages", [])
    )
    
    # Store in database
    result = await db.chat_messages.insert_one(encrypted_message)
    
    logger.info(f"Message sent in room {chat_data.room_id} by user {user_id}")
    
    return {
        "message_id": str(result.inserted_id),
        "timestamp": message_doc["timestamp"].isoformat(),
        "status": "sent"
    }


@router.get("/history/{room_id}")
async def get_chat_history(
    room_id: str,
    limit: int = 50,
    user_id: str = Depends(get_current_user_id)
):
    """
    Get chat history for a room
    
    Returns encrypted messages (decrypted for authorized users)
    """
    db = get_database()
    
    # Fetch messages
    cursor = db.chat_messages.find({
        "room_id": room_id
    }).sort("timestamp", -1).limit(limit)
    
    messages = await cursor.to_list(length=limit)
    
    # Decrypt messages
    decrypted_messages = []
    for msg in messages:
        msg["_id"] = str(msg["_id"])
        decrypted_msg = encryption.decrypt_dict(
            msg,
            ENCRYPTED_FIELDS.get("chat_messages", [])
        )
        decrypted_messages.append(decrypted_msg)
    
    # Reverse to chronological order
    decrypted_messages.reverse()
    
    return {
        "room_id": room_id,
        "messages": decrypted_messages,
        "total_count": len(decrypted_messages)
    }


@router.post("/mark-read/{room_id}")
async def mark_messages_read(
    room_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """
    Mark all messages in a room as read
    """
    db = get_database()
    
    result = await db.chat_messages.update_many(
        {"room_id": room_id, "sender_id": {"$ne": user_id}},
        {"$set": {"read": True}}
    )
    
    return {
        "room_id": room_id,
        "marked_read": result.modified_count
    }


@router.websocket("/ws/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str):
    """
    WebSocket endpoint for real-time chat
    
    Handles live messaging between doctor and patient
    """
    # Get token from query params
    token = websocket.query_params.get("token")
    
    if not token:
        await websocket.close(code=1008)
        return
    
    # Verify token
    user_data = decode_jwt(token)
    if not user_data:
        await websocket.close(code=1008)
        return
    
    user_id = str(user_data.get("user_id") or user_data.get("id"))
    
    # Connect to room
    await manager.connect(websocket, room_id, user_id)
    
    db = get_database()
    
    try:
        while True:
            # Receive message
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            # Prepare message document
            message_doc = {
                "room_id": room_id,
                "sender_id": user_id,
                "sender_role": user_data.get("role", "user"),
                "message": message_data.get("message", ""),
                "message_type": message_data.get("type", "text"),
                "timestamp": datetime.utcnow(),
                "read": False
            }
            
            # Encrypt and store
            encrypted_message = encryption.encrypt_dict(
                message_doc,
                ENCRYPTED_FIELDS.get("chat_messages", [])
            )
            
            result = await db.chat_messages.insert_one(encrypted_message)
            
            # Broadcast to room (except sender)
            broadcast_data = {
                "message_id": str(result.inserted_id),
                "sender_id": user_id,
                "sender_role": user_data.get("role"),
                "message": message_data.get("message"),
                "timestamp": message_doc["timestamp"].isoformat(),
                "type": message_data.get("type", "text")
            }
            
            await manager.send_message(broadcast_data, room_id, exclude_user=user_id)
            
            # Echo back to sender
            await websocket.send_json({**broadcast_data, "status": "sent"})
            
    except WebSocketDisconnect:
        manager.disconnect(room_id, user_id)
        logger.info(f"User {user_id} disconnected from room {room_id}")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(room_id, user_id)


@router.post("/ai-chat")
async def ai_chat(
    message: str,
    user_id: str = Depends(get_current_user_id)
):
    """
    Chat with AI mental health assistant
    
    Provides RAG-based guidance and micro-therapy suggestions
    """
    # Validate message
    if not message or len(message.strip()) < 1:
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    
    # This is a placeholder for RAG implementation
    # In production, integrate with your RAG system
    
    db = get_database()
    
    # Get user's recent severity assessment
    latest_severity = await db.severity_logs.find_one(
        {"user_id": user_id},
        sort=[("created_at", -1)]
    )
    
    # Simple rule-based responses (replace with RAG)
    response = _generate_ai_response(message, latest_severity)
    
    # Store conversation
    conversation_doc = {
        "user_id": user_id,
        "user_message": message,
        "ai_response": response,
        "timestamp": datetime.utcnow()
    }
    
    encrypted_conv = encryption.encrypt_dict(conversation_doc, ["user_message", "ai_response"])
    await db.ai_conversations.insert_one(encrypted_conv)
    
    return {
        "response": response,
        "timestamp": conversation_doc["timestamp"].isoformat()
    }


def _generate_ai_response(message: str, severity_data: dict = None) -> str:
    """
    Generate AI response (placeholder - replace with RAG)
    """
    message_lower = message.lower()
    
    # Crisis keywords
    crisis_keywords = ["suicide", "kill myself", "end it all", "hurt myself"]
    if any(keyword in message_lower for keyword in crisis_keywords):
        return """I'm really concerned about you. Please reach out for immediate help:
        
🚨 **Crisis Helplines:**
- National Suicide Prevention Lifeline: 988
- Crisis Text Line: Text HOME to 741741
- International Association for Suicide Prevention: https://www.iasp.info/resources/Crisis_Centres/

Please talk to someone right away. You matter, and help is available."""
    
    # Anxiety keywords
    if any(word in message_lower for word in ["anxious", "anxiety", "panic", "worried"]):
        return """I understand you're feeling anxious. Here are some techniques that might help:

🧘 **Immediate Relief:**
- Try the 5-4-3-2-1 grounding technique
- Practice deep breathing: Breathe in for 4, hold for 4, out for 4
- Progressive muscle relaxation

Would you like me to guide you through any of these exercises?"""
    
    # Sleep issues
    if any(word in message_lower for word in ["sleep", "insomnia", "tired"]):
        return """Sleep is crucial for mental health. Here are some tips:

😴 **Sleep Hygiene:**
- Consistent sleep schedule (same time daily)
- No screens 1 hour before bed
- Keep bedroom cool and dark
- Avoid caffeine after 2 PM
- Light exercise (not close to bedtime)

Have you tried any of these strategies?"""
    
    # Default supportive response
    return """Thank you for sharing. I'm here to listen and support you.

💙 Remember:
- Your feelings are valid
- It's okay to not be okay sometimes
- Professional help is available and effective
- Small steps count as progress

Would you like to tell me more about what you're experiencing?"""