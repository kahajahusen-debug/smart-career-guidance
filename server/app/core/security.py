import hashlib
import os
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any

import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.core.config import settings
from app.core.database import db, in_memory_store

logger = logging.getLogger("uvicorn")

security_bearer = HTTPBearer(auto_error=False)
ALGORITHM = "HS256"

def hash_password(password: str) -> str:
    """Hash plain text password safely using bcrypt with PBKDF2 fallback."""
    try:
        pw_bytes = password.encode('utf-8')[:72]
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(pw_bytes, salt)
        return hashed.decode('utf-8')
    except Exception as e:
        logger.warning(f"Bcrypt hash fallback triggered: {e}")
        salt = os.urandom(16)
        hashed = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
        return f"pbkdf2:{salt.hex()}:{hashed.hex()}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify plain text password against stored hash."""
    if not hashed_password or not plain_password:
        return False
    try:
        if hashed_password.startswith("pbkdf2:"):
            _, salt_hex, hash_hex = hashed_password.split(":")
            salt = bytes.fromhex(salt_hex)
            check_hash = hashlib.pbkdf2_hmac('sha256', plain_password.encode('utf-8'), salt, 100000).hex()
            return check_hash == hash_hex
        pw_bytes = plain_password.encode('utf-8')[:72]
        hash_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(pw_bytes, hash_bytes)
    except Exception as e:
        logger.error(f"Error verifying password: {e}")
        return False

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Generate JWT access token containing claims."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire, "iat": datetime.now(timezone.utc)})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode and validate a JWT access token."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.PyJWTError as e:
        logger.warning(f"JWT Token validation error: {e}")
        return None

async def get_current_user(auth: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer)) -> Dict[str, Any]:
    """
    FastAPI dependency to extract and validate current authenticated user from JWT token.
    Raises HTTP 401 if token is missing or invalid.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials or token expired",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if not auth or not auth.credentials:
        raise credentials_exception

    payload = decode_access_token(auth.credentials)
    if not payload:
        raise credentials_exception

    user_id: str = payload.get("sub")
    if not user_id:
        raise credentials_exception

    # Retrieve user from DB or in-memory store
    user = None
    if db.is_connected and db.db is not None:
        user = await db.db.users.find_one({"_id": user_id}, {"password_hash": 0})
        if not user:
            user = await db.db.users.find_one({"id": user_id}, {"password_hash": 0})
    
    if not user:
        users_store = in_memory_store.get("users", [])
        user = next((u for u in users_store if u.get("id") == user_id or u.get("_id") == user_id), None)

    if not user:
        raise credentials_exception

    return {
        "id": str(user.get("_id", user.get("id", user_id))),
        "full_name": user.get("full_name", ""),
        "email": user.get("email", "")
    }

async def get_optional_user(auth: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer)) -> Optional[Dict[str, Any]]:
    """Optional user dependency that doesn't raise exception if unauthenticated."""
    if not auth or not auth.credentials:
        return None
    try:
        return await get_current_user(auth)
    except HTTPException:
        return None
