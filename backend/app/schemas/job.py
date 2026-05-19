from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid


class JobSearchRequest(BaseModel):
    limit: int = Field(10, ge=1, le=50)
    force_refresh: bool = False


class JobData(BaseModel):
    id: uuid.UUID
    jsearch_id: str
    title: str
    company: str
    location: Optional[str] = None
    is_remote: bool = False
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    description: Optional[str] = None
    apply_url: Optional[str] = None
    posted_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class JobMatchResult(BaseModel):
    id: uuid.UUID
    jsearch_id: str
    title: str
    company: str
    location: Optional[str] = None
    is_remote: bool
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    description: Optional[str] = None
    apply_url: Optional[str] = None
    posted_at: Optional[datetime] = None
    match_score: float = Field(..., ge=0, le=100)
    match_reasons: List[str] = Field(default_factory=list)
    matching_skills: List[str] = Field(default_factory=list)
    salary_match: bool = True
    location_match: bool = True

    class Config:
        from_attributes = True


class JobSearchResponse(BaseModel):
    search_id: str
    total_matches: int
    matches_returned: int
    processing_time_ms: int
    jobs: List[JobMatchResult]


class JobMatchWithAction(BaseModel):
    match_id: uuid.UUID
    job: JobMatchResult
    match_score: float
    match_reasons: List[str]
    user_action: Optional[str] = None  # 'saved', 'dismissed', 'applied'
    created_at: datetime

    class Config:
        from_attributes = True


class JobMatches(BaseModel):
    total: int
    limit: int
    offset: int
    matches: List[JobMatchWithAction]


class JobActionRequest(BaseModel):
    action: str = Field(..., pattern="^(saved|dismissed|applied)$")


class JobActionResponse(BaseModel):
    message: str
    action: str
    job_id: uuid.UUID
