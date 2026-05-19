from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid


class ExperienceItem(BaseModel):
    company: Optional[str] = None
    role: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None
    skills_used: List[str] = Field(default_factory=list)


class EducationItem(BaseModel):
    degree: Optional[str] = None
    field: Optional[str] = None
    institution: Optional[str] = None
    graduation_year: Optional[int] = None
    gpa: Optional[float] = None


class ParsedResumeData(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    summary: Optional[str] = None
    skills: List[str] = Field(default_factory=list)
    languages: List[str] = Field(default_factory=list)
    certifications: List[str] = Field(default_factory=list)
    experience: List[ExperienceItem] = Field(default_factory=list)
    education: List[EducationItem] = Field(default_factory=list)

    class Config:
        from_attributes = True


class ResumeUploadResponse(BaseModel):
    id: uuid.UUID
    filename: str
    s3_file_path: str
    upload_date: datetime
    parsed_data: ParsedResumeData

    class Config:
        from_attributes = True


class ResumeResponse(BaseModel):
    id: uuid.UUID
    filename: str
    s3_file_path: str
    upload_date: datetime
    parsed_data: ParsedResumeData
    raw_text: Optional[str] = None

    class Config:
        from_attributes = True


class ResumeDeleteResponse(BaseModel):
    message: str
