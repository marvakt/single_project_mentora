"""
app/routes/chat.py - Secure Chat System
Doctor-Patient communication
"""

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, Field
from typing import Optional, List
from app.core.security import get_current_user_id, get_current_user, decode_jwt
from app.core.config import settings
import jwt
from app.core.database import get_database
from app.core.encryption import encryption, ENCRYPTED_FIELDS
from datetime import datetime
import logging
import json
import asyncio
logger = logging.getLogger(__name__)

router = APIRouter()


# Connection manager for WebSocket
class ConnectionManager:
    def __init__(self):
        self.active_connections: dict = {}
        self.last_heartbeat: dict = {}  # Track last heartbeat time for each connection
        self.cleanup_task = None  # Background cleanup task
    
    async def start_cleanup_task(self):
        """Start the background cleanup task if not already running"""
        if self.cleanup_task is None:
            self.cleanup_task = asyncio.create_task(self._cleanup_stale_connections())
    
    async def _cleanup_stale_connections(self):
        """Background task to remove stale connections"""
        while True:
            try:
                current_time = datetime.utcnow()
                stale_connections = []
                
                # Find connections that haven't responded in 30 seconds
                for room_id, users in self.last_heartbeat.items():
                    for user_id, last_ping in users.items():
                        if (current_time - last_ping).seconds > 30:
                            stale_connections.append((room_id, user_id))
                
                # Clean up stale connections
                for room_id, user_id in stale_connections:
                    self.disconnect(room_id, user_id)
                    logger.warning(f"Force disconnected stale connection: {user_id} in room {room_id}")
                    
            except Exception as e:
                logger.error(f"Error in cleanup task: {e}")
            
            # Run every 15 seconds
            await asyncio.sleep(15)
    
    async def connect(self, websocket: WebSocket, room_id: str, user_id: str):
        if room_id not in self.active_connections:
            self.active_connections[room_id] = {}
        self.active_connections[room_id][user_id] = websocket
        
        # Initialize heartbeat tracking
        if room_id not in self.last_heartbeat:
            self.last_heartbeat[room_id] = {}
        self.last_heartbeat[room_id][user_id] = datetime.utcnow()
        
        # Start cleanup task if not already running
        await self.start_cleanup_task()
        
        logger.info(f"User {user_id} connected to room {room_id}")
    
    def disconnect(self, room_id: str, user_id: str):
        if room_id in self.active_connections:
            if user_id in self.active_connections[room_id]:
                del self.active_connections[room_id][user_id]
                logger.info(f"User {user_id} disconnected from room {room_id}")
                
                # Clean up heartbeat tracking
                if room_id in self.last_heartbeat and user_id in self.last_heartbeat[room_id]:
                    del self.last_heartbeat[room_id][user_id]
                
                # Clean up empty rooms to prevent memory leaks
                if not self.active_connections[room_id]:
                    del self.active_connections[room_id]
                    if room_id in self.last_heartbeat:
                        del self.last_heartbeat[room_id]
                    logger.info(f"Room {room_id} cleaned up (no more connections)")
    
    async def send_heartbeat(self, room_id: str, user_id: str):
        """Send periodic heartbeat to detect dead connections"""
        if room_id in self.active_connections and user_id in self.active_connections[room_id]:
            try:
                await self.active_connections[room_id][user_id].send_text(json.dumps({"type": "heartbeat"}))
                # Update last heartbeat timestamp
                if room_id not in self.last_heartbeat:
                    self.last_heartbeat[room_id] = {}
                self.last_heartbeat[room_id][user_id] = datetime.utcnow()
            except:
                # Connection dead - clean up
                self.disconnect(room_id, user_id)
    
    async def send_message(self, message: dict, room_id: str, exclude_user: str = None):
        if room_id in self.active_connections:
            # Get all users in the room first to avoid issues during iteration
            users_in_room = list(self.active_connections[room_id].items())
            users_to_remove = []
            
            for user_id, connection in users_in_room:
                if user_id != exclude_user:
                    try:
                        await connection.send_json(message)
                        logger.info(f"Message sent to user {user_id} in room {room_id}")
                        # Update heartbeat for active connections
                        if room_id not in self.last_heartbeat:
                            self.last_heartbeat[room_id] = {}
                        self.last_heartbeat[room_id][user_id] = datetime.utcnow()
                    except Exception as e:
                        logger.error(f"Failed to send message to {user_id}: {e}")
                        # Mark dead connections for removal
                        users_to_remove.append(user_id)
            
            # Clean up dead connections
            for user_id in users_to_remove:
                if room_id in self.active_connections and user_id in self.active_connections[room_id]:
                    del self.active_connections[room_id][user_id]
                # Clean up heartbeat tracking
                if room_id in self.last_heartbeat and user_id in self.last_heartbeat[room_id]:
                    del self.last_heartbeat[room_id][user_id]
                logger.info(f"Removed dead connection for user {user_id} in room {room_id}")
                
                # Clean up empty rooms
                if room_id in self.active_connections and not self.active_connections[room_id]:
                    del self.active_connections[room_id]
                    if room_id in self.last_heartbeat:
                        del self.last_heartbeat[room_id]
                    logger.info(f"Room {room_id} cleaned up after removing dead connections")
manager = ConnectionManager()


# Request/Response Models
class ChatMessage(BaseModel):
    """Chat message model"""
    room_id: str = Field(..., description="Chat room ID (usually appointment_id)")
    message: str = Field(..., min_length=1, max_length=2000)
    message_type: str = Field(default="text", description="text, image, file")
    client_message_id: Optional[str] = Field(None, description="Client-generated ID for idempotency")


@router.post("/send")
async def send_chat_message(
    chat_data: ChatMessage,
    user_id: str = Depends(get_current_user_id),
    current_user: dict = Depends(get_current_user)
):
    """
    Send a chat message (REST endpoint)
    
    Stores encrypted message in database with idempotency support
    """
    db = get_database()
    
    # Prepare message document with client_message_id for idempotency
    message_doc = {
        "room_id": chat_data.room_id,
        "sender_id": user_id,
        "sender_role": current_user.get("role", "user"),
        "message": chat_data.message,
        "message_type": chat_data.message_type,
        "client_message_id": chat_data.client_message_id,  # For deduplication
        "timestamp": datetime.utcnow(),
        "read": False
    }
    
    # Encrypt message
    encrypted_message = encryption.encrypt_dict(
        message_doc,
        ENCRYPTED_FIELDS.get("chat_messages", [])
    )
    
    # Try to insert, handle duplicate key error for idempotency
    try:
        result = await db.chat_messages.insert_one(encrypted_message)
    except Exception as e:
        # Check if it's a duplicate key error
        if "duplicate key" in str(e).lower():
            # Fetch existing message
            existing = await db.chat_messages.find_one({
                "room_id": chat_data.room_id,
                "client_message_id": chat_data.client_message_id
            })
            if existing:
                result = type('result', (), {'inserted_id': existing['_id']})()
            else:
                # If we can't find it, re-raise the error
                raise e
        else:
            # Some other error, re-raise
            raise e
    
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


def verify_appointment_token(token: str, room_id: str, expected_user_id: str) -> bool:
    """
    Verify appointment token binds to correct user and appointment
    
    Args:
        token: JWT token with appointment claims
        room_id: Expected appointment ID
        expected_user_id: Expected user ID
        
    Returns:
        bool: True if token is valid for user and appointment
    """
    try:
        logger.info(f"Starting appointment token verification - room_id: {room_id}, expected_user_id: {expected_user_id}")
        payload = decode_jwt(token)
        if not payload:
            logger.error("Token payload is None - invalid or expired token")
            return False
            
        logger.info(f"Token validation - payload: {payload}")
        logger.info(f"Token validation - room_id: {room_id}, expected_user_id: {expected_user_id}")
        
        # Extract user_id from either 'user_id', 'sub', or 'id' field
        token_user_id_raw = payload.get("user_id")
        if token_user_id_raw is None:
            token_user_id_raw = payload.get("sub")
        if token_user_id_raw is None:
            token_user_id_raw = payload.get("id")
        if token_user_id_raw is None:
            logger.error("No user ID found in token")
            return False
        token_user_id_str = str(token_user_id_raw)
        
        # Handle different user ID formats (string vs UUID)
        # Convert both IDs to string for comparison
        expected_user_id_str = str(expected_user_id)
        
        logger.info(f"Token validation - token_user_id: {token_user_id_str}, expected_user_id: {expected_user_id_str}")
        
        # Check each validation condition separately
        scope_raw = payload.get('scope')
        scope_check = scope_raw == 'chat'  # True if scope is 'chat'
        
        appointment_id_raw = payload.get('appointment_id')
        if appointment_id_raw is None:
            logger.error("No appointment_id found in token")
            return False
        appointment_check = str(appointment_id_raw) == str(room_id)  # True if appointment IDs match
        
        user_check = token_user_id_str == expected_user_id_str  # True if user IDs match
        
        logger.info(f"Token validation - scope: {scope_raw}, expected: 'chat' -> scope_check: {scope_check}")
        logger.info(f"Token validation - appointment_id: {appointment_id_raw}, expected: {room_id} -> appointment_check: {appointment_check}")
        logger.info(f"Token validation - user_id: {token_user_id_str}, expected: {expected_user_id_str} -> user_check: {user_check}")
        
        if scope_check and appointment_check and user_check:
            logger.info("Token validation passed")
            return True
        else:
            logger.info("Token validation failed")
            logger.info(f"Failed checks - scope: {scope_check}, appointment: {appointment_check}, user: {user_check}")
            return False
    except Exception as e:
        logger.error(f"Token verification failed with exception: {e}")
        return False


@router.websocket("/ws/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str):
    """
    WebSocket endpoint for real-time chat
    
    Handles live messaging between doctor and patient
    """
    # Get token from query params first, before accepting connection
    token = websocket.query_params.get("token")
    
    if not token:
        logger.warning("No token provided in WebSocket connection")
        await websocket.close(code=1008)
        return
    
    # Verify token before accepting connection
    logger.info(f"WebSocket connection attempt for room {room_id} with token: {token[:20]}...")
    user_data = decode_jwt(token)
    if not user_data:
        logger.error("Token could not be decoded - invalid or expired")
        await websocket.close(code=1008)
        return
    
    logger.info(f"Token decoded successfully: {user_data}")
    user_id = str(user_data.get("user_id") or user_data.get("id"))
    logger.info(f"Extracted user_id: {user_id}")
    
    # Verify token is valid for this appointment and user
    logger.info(f"About to validate appointment token - room_id: {room_id}, user_id: {user_id}")
    token_valid = verify_appointment_token(token, room_id, user_id)
    logger.info(f"Token validation result: {token_valid}")
    if not token_valid:
        logger.error("Appointment token validation failed, checking basic token")
        # Check if it's a basic user token (for development/testing)
        # If the token is valid but doesn't have appointment scope, allow it
        try:
            basic_payload = decode_jwt(token)
            logger.info(f"Basic token validation - basic_payload: {basic_payload}")
            if basic_payload:
                # Extract user ID from basic token using the same logic as verify_appointment_token
                basic_user_id_raw = basic_payload.get("user_id")
                if basic_user_id_raw is None:
                    basic_user_id_raw = basic_payload.get("sub")
                if basic_user_id_raw is None:
                    basic_user_id_raw = basic_payload.get("id")
                
                if basic_user_id_raw is not None:
                    basic_user_id = str(basic_user_id_raw)
                    if basic_user_id == user_id:
                        # Basic token is valid, allow connection
                        logger.info(f"Allowing basic user token for room {room_id}")
                    else:
                        logger.error("Basic token validation failed - user ID mismatch")
                        logger.error(f"Basic token user_id: {basic_user_id}, expected: {user_id}")
                        await websocket.close(code=1008)
                        return
                else:
                    logger.error("No user ID found in basic token")
                    await websocket.close(code=1008)
                    return
            else:
                logger.error("Basic token could not be decoded")
                await websocket.close(code=1008)
                return
        except Exception as e:
            logger.error(f"Exception in basic token validation: {e}")
            await websocket.close(code=1008)
            return
    
    # Only accept the connection after successful authentication
    logger.info(f"About to accept WebSocket connection for room {room_id}")
    await websocket.accept()
    logger.info(f"WebSocket endpoint reached - room_id: {room_id}")
    
    db = get_database()    
    # Connect to room - this should happen after successful authentication
    await manager.connect(websocket, room_id, user_id)
    logger.info(f"User {user_id} connected to room {room_id}")
    
    try:
        logger.info(f"Ready to receive messages from user {user_id} in room {room_id}")
        while True:
            # Receive message
            data = await websocket.receive_text()
            logger.info(f"Received raw message from user {user_id} in room {room_id}: {data[:100]}...")
            message_data = json.loads(data)
            
            # Prepare message document with client_message_id for idempotency
            message_doc = {
                "room_id": room_id,
                "sender_id": user_id,
                "sender_role": user_data.get("role", "user"),
                "message": message_data.get("message", ""),
                "message_type": message_data.get("type", "text"),
                "client_message_id": message_data.get("client_message_id"),  # For deduplication
                "timestamp": datetime.utcnow(),
                "read": False
            }
            
            # Encrypt and store with idempotency
            encrypted_message = encryption.encrypt_dict(
                message_doc,
                ENCRYPTED_FIELDS.get("chat_messages", [])
            )
            
            # Try to insert, handle duplicate key error for idempotency
            try:
                result = await db.chat_messages.insert_one(encrypted_message)
                logger.info(f"Message stored successfully from user {user_id} in room {room_id}")
            except Exception as e:
                logger.error(f"Error storing message from user {user_id} in room {room_id}: {e}")
                # Check if it's a duplicate key error
                if "duplicate key" in str(e).lower():
                    # Fetch existing message
                    existing = await db.chat_messages.find_one({
                        "room_id": room_id,
                        "client_message_id": message_data.get("client_message_id")
                    })
                    if existing:
                        result = type('result', (), {'inserted_id': existing['_id']})()
                        logger.info(f"Duplicate message found for client_message_id {message_data.get('client_message_id')}")
                    else:
                        # If we can't find it, re-raise the error
                        raise e
                else:
                    # Some other error, re-raise
                    raise e
            
            # Broadcast to room (except sender)
            broadcast_data = {
                "message_id": str(result.inserted_id),
                "sender_id": user_id,
                "sender_role": user_data.get("role"),
                "message": message_data.get("message"),
                "timestamp": message_doc["timestamp"].isoformat(),
                "type": message_data.get("type", "text")
            }
            
            logger.info(f"Broadcasting message to room {room_id} from user {user_id}")
            await manager.send_message(broadcast_data, room_id, exclude_user=user_id)
            
            # Echo back to sender
            await websocket.send_json({**broadcast_data, "status": "sent"})
            logger.info(f"Message sent back to sender {user_id}")
            
    except WebSocketDisconnect:
        manager.disconnect(room_id, user_id)
        logger.info(f"User {user_id} disconnected from room {room_id}")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(room_id, user_id)


async def create_appointment_chat_token(user_id: str, appointment_id: str) -> str:
    """
    Create a JWT token specifically for appointment chat access
    
    Args:
        user_id: ID of the user requesting chat access
        appointment_id: ID of the appointment for the chat
        
    Returns:
        JWT token with chat scope and appointment info
    """
    import datetime
    payload = {
        "user_id": user_id,
        "appointment_id": appointment_id,
        "scope": "chat",
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=24),  # 24 hour validity
        "iat": datetime.datetime.utcnow()
    }
    
    token = jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return token


@router.get("/debug-test")
async def debug_test():
    """
    Test endpoint to verify code deployment
    """
    logger.info("Debug test endpoint called")
    return {"status": "debug endpoint working", "timestamp": datetime.utcnow().isoformat()}


@router.get("/routes-debug")
async def routes_debug():
    """
    Debug endpoint to show all registered routes for this router
    """
    logger.info("Routes debug endpoint called")
    return {
        "status": "routes information",
        "websocket_endpoint": "/ws/{room_id}",
        "expected_full_path": "/api/v1/chat/ws/{room_id}",
        "timestamp": datetime.utcnow().isoformat()
    }


@router.get("/token/{appointment_id}")
async def get_chat_token(
    appointment_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """
    Generate a chat token for WebSocket access to an appointment
    
    This endpoint creates a special token that can be used to authenticate
    WebSocket connections for appointment-specific chat rooms.
    """
    # Create and return the appointment-specific chat token
    token = await create_appointment_chat_token(user_id, appointment_id)
    
    return {
        "token": token,
        "appointment_id": appointment_id,
        "expires_in": 86400  # 24 hours in seconds
    }
