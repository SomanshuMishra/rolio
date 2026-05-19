from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import logging

from ..database import get_db
from ..models import UserPreferences
from ..utils.deps import get_current_user

router = APIRouter(prefix="/settings", tags=["settings"])
logger = logging.getLogger(__name__)


@router.get("/preferences")
def get_preferences(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get user's job search preferences."""
    try:
        preferences = db.query(UserPreferences).filter(
            UserPreferences.user_id == current_user.id,
        ).first()

        if not preferences:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Preferences not found",
            )

        return {
            "id": str(preferences.id),
            "user_id": str(preferences.user_id),
            "preferred_roles": preferences.preferred_roles or [],
            "preferred_locations": preferences.preferred_locations or [],
            "salary_min": preferences.salary_min,
            "salary_max": preferences.salary_max,
            "remote_preference": preferences.remote_preference,
            "years_of_experience": preferences.years_of_experience,
            "created_at": preferences.created_at,
            "updated_at": preferences.updated_at,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving preferences: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve preferences",
        )


@router.put("/preferences")
def update_preferences(
    preferred_roles: Optional[List[str]] = None,
    preferred_locations: Optional[List[str]] = None,
    salary_min: Optional[str] = None,
    salary_max: Optional[str] = None,
    remote_preference: Optional[str] = None,
    years_of_experience: Optional[str] = None,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update user's job search preferences."""
    try:
        preferences = db.query(UserPreferences).filter(
            UserPreferences.user_id == current_user.id,
        ).first()

        if not preferences:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Preferences not found",
            )

        # Validate remote_preference
        if remote_preference and remote_preference not in ["remote", "hybrid", "onsite", "any"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="remote_preference must be one of: remote, hybrid, onsite, any",
            )

        # Update fields
        if preferred_roles is not None:
            preferences.preferred_roles = preferred_roles
        if preferred_locations is not None:
            preferences.preferred_locations = preferred_locations
        if salary_min is not None:
            preferences.salary_min = salary_min
        if salary_max is not None:
            preferences.salary_max = salary_max
        if remote_preference is not None:
            preferences.remote_preference = remote_preference
        if years_of_experience is not None:
            preferences.years_of_experience = years_of_experience

        db.commit()
        db.refresh(preferences)

        logger.info(f"Updated preferences for user {current_user.id}")

        return {
            "id": str(preferences.id),
            "user_id": str(preferences.user_id),
            "preferred_roles": preferences.preferred_roles or [],
            "preferred_locations": preferences.preferred_locations or [],
            "salary_min": preferences.salary_min,
            "salary_max": preferences.salary_max,
            "remote_preference": preferences.remote_preference,
            "years_of_experience": preferences.years_of_experience,
            "created_at": preferences.created_at,
            "updated_at": preferences.updated_at,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating preferences: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update preferences",
        )
