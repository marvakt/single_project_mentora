"""
app/core/security.py - JWT Authentication and Authorization
"""

import logging
from typing import Optional

import jwt
from app.core.config import settings
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

logger = logging.getLogger(__name__)

security = HTTPBearer()


def decode_jwt(token: str) -> Optional[dict]:
    """
    Decode and verify JWT token
    
    Args:
        token: JWT token string
        
    Returns:
        Decoded token payload or None if invalid
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except jwt.ExpiredSignatureError:
        logger.error("Token has expired")
        return None
    except jwt.InvalidTokenError as e:
        logger.error(f"Invalid token: {e}")
        return None


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """
    Get current authenticated user from JWT token
    
    Args:
        credentials: HTTP Authorization credentials
        
    Returns:
        User payload from JWT
        
    Raises:
        HTTPException: If token is invalid or expired
    """
    token = credentials.credentials
    payload = decode_jwt(token)
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return payload


async def get_current_user_id(current_user: dict = Depends(get_current_user)) -> str:
    """
    Extract user ID from current user payload
    
    Args:
        current_user: Current user payload from JWT
        
    Returns:
        User ID string
    """
    user_id = current_user.get("user_id") or current_user.get("id")
    
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User ID not found in token"
        )
    
    return str(user_id)


async def require_role(
    required_roles: list[str],
    current_user: dict = Depends(get_current_user)
) -> dict:
    """
    Verify user has required role
    
    Args:
        required_roles: List of acceptable roles
        current_user: Current user payload from JWT
        
    Returns:
        Current user payload if authorized
        
    Raises:
        HTTPException: If user doesn't have required role
    """
    user_role = current_user.get("role")
    
    if user_role not in required_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Insufficient permissions. Required roles: {required_roles}"
        )
    
    return current_user


def require_doctor(current_user: dict = Depends(get_current_user)) -> dict:
    """Require doctor role"""
    return require_role(["doctor"], current_user)


def require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    """Require admin role"""
    return require_role(["admin"], current_user)