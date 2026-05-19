from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import uuid

from ..database import get_db
from ..models import User, APIKey, UserPreferences
from ..utils.deps import get_current_user
from ..utils.security import encrypt_api_key, decrypt_api_key, get_api_key_preview

router = APIRouter(prefix="/profile", tags=["profile"])


# Placeholder for profile implementation
# TODO: Implement in next iteration
