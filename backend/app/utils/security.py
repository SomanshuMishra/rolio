from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from typing import Optional, Dict, Any
from cryptography.fernet import Fernet
import base64
import hashlib
from ..config import settings

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Hash password using bcrypt."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash."""
    return pwd_context.verify(plain_password, hashed_password)


# JWT Tokens
def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: Dict[str, Any]) -> str:
    """Create JWT refresh token (longer expiry)."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode and validate JWT token."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None


# API Key Encryption
def get_encryption_key() -> bytes:
    """Get or derive encryption key from SECRET_KEY."""
    # Use first 32 bytes of SHA256(SECRET_KEY) as encryption key
    key = hashlib.sha256(settings.SECRET_KEY.encode()).digest()
    # Fernet requires base64-encoded 32-byte key
    return base64.urlsafe_b64encode(key)


def encrypt_api_key(api_key: str) -> str:
    """Encrypt API key with AES-256 (Fernet)."""
    fernet = Fernet(get_encryption_key())
    encrypted = fernet.encrypt(api_key.encode())
    return encrypted.decode()


def decrypt_api_key(encrypted_key: str) -> Optional[str]:
    """Decrypt API key."""
    try:
        fernet = Fernet(get_encryption_key())
        decrypted = fernet.decrypt(encrypted_key.encode())
        return decrypted.decode()
    except Exception:
        return None


def get_api_key_preview(api_key: str) -> str:
    """Get preview of API key (show only last 4 chars)."""
    if len(api_key) <= 4:
        return "***"
    return f"{api_key[:3]}...{api_key[-4:]}"
