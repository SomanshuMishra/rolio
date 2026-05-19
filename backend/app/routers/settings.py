from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..utils.deps import get_current_user

router = APIRouter(prefix="/settings", tags=["settings"])


# Placeholder for settings implementation
# TODO: Implement in next iteration
