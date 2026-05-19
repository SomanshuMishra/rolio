from sqlalchemy import Column, String, DateTime, Boolean, Text, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from datetime import datetime
import uuid
from ..database import Base


class Resume(Base):
    __tablename__ = "resumes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), unique=True, nullable=False, index=True)
    filename = Column(String(255))
    s3_file_path = Column(String(500), nullable=False)
    parsed_data = Column(JSONB, nullable=False)  # Structured extracted data
    raw_text = Column(Text)  # Raw text from PDF
    upload_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index("idx_resumes_user_id", "user_id"),
    )
