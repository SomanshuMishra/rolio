from sqlalchemy import Column, String, Boolean, DateTime, func, Index, Text, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from datetime import datetime
import uuid
from ..database import Base
from ..config import settings

# Use String IDs for SQLite, UUID for PostgreSQL
if settings.DATABASE_URL.startswith("sqlite"):
    ID_TYPE = String(36)
    ID_DEFAULT = lambda: str(uuid.uuid4())
else:
    ID_TYPE = UUID(as_uuid=True)
    ID_DEFAULT = uuid.uuid4


class User(Base):
    __tablename__ = "users"

    id = Column(ID_TYPE, primary_key=True, default=ID_DEFAULT)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255))
    avatar_url = Column(String(500))
    phone_number = Column(String(20))
    is_onboarding_complete = Column(Boolean, default=False, nullable=False)
    firebase_uid = Column(String(255), unique=True, nullable=True, index=True)
    auth_provider = Column(String(50), default='email', nullable=False)  # 'email', 'google', etc.
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)


class APIKey(Base):
    __tablename__ = "user_api_keys"

    id = Column(ID_TYPE, primary_key=True, default=ID_DEFAULT)
    user_id = Column(ID_TYPE, nullable=False, index=True)
    provider = Column(String(50), nullable=False)  # 'openai', 'anthropic', 'google', 'groq', 'grok'
    encrypted_key = Column(String(500), nullable=False)
    model_preference = Column(String(255))
    is_default = Column(Boolean, default=False, nullable=False)  # Only one key per user can be default
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index("idx_user_api_keys_user_id", "user_id"),
        Index("uq_user_provider", "user_id", "provider", unique=True),
    )


class UserPreferences(Base):
    __tablename__ = "user_preferences"

    id = Column(ID_TYPE, primary_key=True, default=ID_DEFAULT)
    user_id = Column(ID_TYPE, unique=True, nullable=False, index=True)
    # Store arrays as comma-separated strings for SQLite compatibility
    preferred_roles = Column(String(1000), default="")
    preferred_locations = Column(String(1000), default="")
    salary_min = Column(String(20))
    salary_max = Column(String(20))
    remote_preference = Column(String(50), default="any")  # 'remote', 'hybrid', 'onsite', 'any'
    years_of_experience = Column(String(20))
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(ID_TYPE, primary_key=True, default=ID_DEFAULT)
    user_id = Column(ID_TYPE, nullable=False, index=True)
    token_hash = Column(String(255), unique=True, nullable=False)  # Hash of token for security
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    revoked = Column(Boolean, default=False)

    __table_args__ = (
        Index("idx_refresh_tokens_user_id", "user_id"),
        Index("idx_refresh_tokens_expires_at", "expires_at"),
    )


class JobSearch(Base):
    __tablename__ = "job_searches"

    id = Column(ID_TYPE, primary_key=True, default=ID_DEFAULT)
    user_id = Column(ID_TYPE, nullable=False, index=True)
    status = Column(String(20), default="pending")  # pending, in_progress, completed, failed
    filters = Column(Text)  # JSON string of search filters
    total_jobs_searched = Column(Integer, default=0)
    total_matches = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime)

    __table_args__ = (
        Index("idx_job_searches_user_id", "user_id"),
    )
