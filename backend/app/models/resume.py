from sqlalchemy import Column, String, DateTime, Boolean, Text, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
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


class Resume(Base):
    __tablename__ = "resumes"

    id = Column(ID_TYPE, primary_key=True, default=ID_DEFAULT)
    user_id = Column(ID_TYPE, unique=True, nullable=False, index=True)
    filename = Column(String(255))
    s3_file_path = Column(String(500), nullable=False)
    parsed_data = Column(JSON_TYPE, nullable=False)  # Structured extracted data
    raw_text = Column(Text)  # Raw text from PDF
    upload_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index("idx_resumes_user_id", "user_id"),
    )
