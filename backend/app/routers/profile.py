from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
import logging

from ..database import get_db
from ..models import User, APIKey
from ..utils.deps import get_current_user
from ..utils.security import encrypt_api_key, decrypt_api_key, get_api_key_preview


class UpdateProfileRequest(BaseModel):
    full_name: str = None
    avatar_url: str = None

router = APIRouter(prefix="/profile", tags=["profile"])
logger = logging.getLogger(__name__)


class UserProfileResponse:
    """User profile response model."""

    def __init__(self, user: User):
        self.id = str(user.id)
        self.email = user.email
        self.full_name = user.full_name
        self.avatar_url = user.avatar_url
        self.created_at = user.created_at
        self.is_active = user.is_active


class APIKeyResponse:
    """API key response model (no actual key)."""

    def __init__(self, api_key: APIKey):
        self.id = str(api_key.id)
        self.provider = api_key.provider
        self.model_preference = api_key.model_preference
        self.is_default = api_key.is_default
        self.created_at = api_key.created_at
        self.key_preview = get_api_key_preview(decrypt_api_key(api_key.encrypted_key) or "")


@router.get("")
def get_profile(current_user: User = Depends(get_current_user)):
    """Get current user's profile."""
    return {
        "user": {
            "id": str(current_user.id),
            "email": current_user.email,
            "full_name": current_user.full_name,
            "avatar_url": current_user.avatar_url,
            "created_at": current_user.created_at,
            "is_active": current_user.is_active,
        }
    }


@router.put("")
def update_profile(
    request: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update user profile."""
    try:
        if request.full_name:
            current_user.full_name = request.full_name
        if request.avatar_url:
            current_user.avatar_url = request.avatar_url

        db.commit()
        db.refresh(current_user)

        logger.info(f"Updated profile for user {current_user.id}")

        return {
            "user": {
                "id": str(current_user.id),
                "email": current_user.email,
                "full_name": current_user.full_name,
                "avatar_url": current_user.avatar_url,
                "created_at": current_user.created_at,
                "is_active": current_user.is_active,
            }
        }

    except Exception as e:
        logger.error(f"Error updating profile: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update profile",
        )


@router.post("/api-keys")
def add_api_key(
    provider: str,
    api_key: str,
    model_preference: str = None,
    is_default: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Add encrypted API key for any supported provider."""
    try:
        if provider.lower() not in ["openai", "anthropic", "google", "groq", "grok"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Provider must be 'openai', 'anthropic', 'google', 'groq', or 'grok'",
            )

        if not api_key or len(api_key) < 10:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid API key format",
            )

        # If setting as default, unset all other defaults
        if is_default:
            db.query(APIKey).filter(
                APIKey.user_id == current_user.id,
                APIKey.is_default == True,
            ).update({APIKey.is_default: False})
            db.commit()

        # Check if key already exists for this provider
        existing = db.query(APIKey).filter(
            APIKey.user_id == current_user.id,
            APIKey.provider == provider.lower(),
        ).first()

        # Encrypt the key
        encrypted_key = encrypt_api_key(api_key)

        if existing:
            # Update existing key
            existing.encrypted_key = encrypted_key
            existing.model_preference = model_preference
            existing.is_default = is_default
            db.commit()
            db.refresh(existing)
            api_key_record = existing
            logger.info(f"Updated API key for user {current_user.id}: {provider}")
        else:
            # Create new key
            api_key_record = APIKey(
                user_id=current_user.id,
                provider=provider.lower(),
                encrypted_key=encrypted_key,
                model_preference=model_preference,
                is_default=is_default,
            )
            db.add(api_key_record)
            db.commit()
            db.refresh(api_key_record)
            logger.info(f"Added API key for user {current_user.id}: {provider}")

        return {
            "id": str(api_key_record.id),
            "provider": api_key_record.provider,
            "model_preference": api_key_record.model_preference,
            "is_default": api_key_record.is_default,
            "created_at": api_key_record.created_at,
            "key_preview": get_api_key_preview(api_key),
        }

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        logger.error(f"Error adding API key: {e}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add API key: {str(e)}",
        )


@router.delete("/api-keys/{provider}")
def delete_api_key(
    provider: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete API key for a provider."""
    try:
        api_key = db.query(APIKey).filter(
            APIKey.user_id == current_user.id,
            APIKey.provider == provider.lower(),
        ).first()

        if not api_key:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No API key found for {provider}",
            )

        db.delete(api_key)
        db.commit()

        logger.info(f"Deleted API key for user {current_user.id}: {provider}")

        return {"message": "API key deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting API key: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete API key",
        )


@router.put("/api-keys/{provider}/default")
def set_default_api_key(
    provider: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Set an API key as the default for job searching."""
    try:
        api_key = db.query(APIKey).filter(
            APIKey.user_id == current_user.id,
            APIKey.provider == provider.lower(),
        ).first()

        if not api_key:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No API key found for {provider}",
            )

        # Unset all other defaults for this user
        db.query(APIKey).filter(
            APIKey.user_id == current_user.id,
            APIKey.is_default == True,
        ).update({APIKey.is_default: False})

        # Set this key as default
        api_key.is_default = True
        db.commit()
        db.refresh(api_key)

        logger.info(f"Set {provider} as default API key for user {current_user.id}")

        return {
            "id": str(api_key.id),
            "provider": api_key.provider,
            "model_preference": api_key.model_preference,
            "is_default": api_key.is_default,
            "created_at": api_key.created_at,
            "key_preview": get_api_key_preview(decrypt_api_key(api_key.encrypted_key) or ""),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error setting default API key: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to set default API key",
        )


@router.get("/api-keys")
def list_api_keys(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all API keys (without actual keys)."""
    try:
        api_keys = db.query(APIKey).filter(
            APIKey.user_id == current_user.id,
        ).all()

        keys_data = []
        for key in api_keys:
            decrypted = decrypt_api_key(key.encrypted_key)
            keys_data.append(
                {
                    "id": str(key.id),
                    "provider": key.provider,
                    "model_preference": key.model_preference,
                    "is_default": key.is_default,
                    "created_at": key.created_at,
                    "key_preview": get_api_key_preview(decrypted or ""),
                }
            )

        return {"api_keys": keys_data}

    except Exception as e:
        logger.error(f"Error listing API keys: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list API keys",
        )
