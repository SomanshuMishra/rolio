from sqlalchemy import Column, String, DateTime, Boolean, Text, Float, Integer, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from datetime import datetime
import uuid
from ..database import Base
from ..config import settings

# Use String IDs for SQLite, UUID for PostgreSQL
if settings.DATABASE_URL.startswith("sqlite"):
    ID_TYPE = String(36)
    ID_DEFAULT = lambda: str(uuid.uuid4())
    JSON_TYPE = Text
else:
    ID_TYPE = UUID(as_uuid=True)
    ID_DEFAULT = uuid.uuid4
    JSON_TYPE = JSONB


class Job(Base):
    __tablename__ = "jobs_cache"

    id = Column(ID_TYPE, primary_key=True, default=ID_DEFAULT)
    jsearch_id = Column(String(255), unique=True, nullable=False, index=True)
    title = Column(String(255), nullable=False)
    company = Column(String(255), nullable=False)
    location = Column(String(255))
    is_remote = Column(Boolean, default=False)
    salary_min = Column(Integer)
    salary_max = Column(Integer)
    description = Column(Text)
    requirements = Column(String(1000), default="")  # Store as comma-separated string
    apply_url = Column(String(500), nullable=False)
    source = Column(String(50), default="jsearch")
    posted_at = Column(DateTime)
    cached_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime)  # 24 hours from cached_at

    __table_args__ = (
        Index("idx_jobs_cache_jsearch_id", "jsearch_id"),
        Index("idx_jobs_cache_expires_at", "expires_at"),
        Index("idx_jobs_cache_location", "location"),
        Index("idx_jobs_cache_company", "company"),
    )


class UserJobMatch(Base):
    __tablename__ = "user_job_matches"

    id = Column(ID_TYPE, primary_key=True, default=ID_DEFAULT)
    user_id = Column(ID_TYPE, nullable=False, index=True)
    job_id = Column(ID_TYPE, nullable=False, index=True)
    match_score = Column(Float, nullable=False)  # 0-100
    match_reasons = Column(JSON_TYPE)  # List of reasons + confidence scores
    embedding_score = Column(Float)  # Raw cosine similarity
    salary_match = Column(Boolean)
    location_match = Column(Boolean)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    __table_args__ = (
        Index("idx_user_job_matches_user_id", "user_id"),
        Index("idx_user_job_matches_job_id", "job_id"),
        Index("idx_user_job_matches_created_at", "created_at"),
        Index("idx_user_job_matches_score", "match_score"),
        Index("uq_user_job_match", "user_id", "job_id", unique=True),
    )


class UserJobAction(Base):
    __tablename__ = "user_job_actions"

    id = Column(ID_TYPE, primary_key=True, default=ID_DEFAULT)
    user_id = Column(ID_TYPE, nullable=False, index=True)
    job_id = Column(ID_TYPE, nullable=False, index=True)
    action = Column(String(50), nullable=False)  # 'saved', 'dismissed', 'applied'
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index("idx_user_job_actions_user_id", "user_id"),
        Index("idx_user_job_actions_job_id", "job_id"),
        Index("idx_user_job_actions_action", "action"),
        Index("uq_user_job_action", "user_id", "job_id", "action", unique=True),
    )
