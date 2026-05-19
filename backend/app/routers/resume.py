from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
import tempfile
import os
import json
import logging

from ..database import get_db
from ..models import Resume
from ..schemas.resume import ResumeUploadResponse, ResumeResponse, ResumeDeleteResponse, ParsedResumeData
from ..utils.deps import get_current_user
from ..utils.file_handler import get_file_handler
from ..services.resume_parser import ResumeParser
from ..models.user import User

router = APIRouter(prefix="/resume", tags=["resume"])
logger = logging.getLogger(__name__)
parser = ResumeParser()
file_handler = get_file_handler()


@router.post("/upload", response_model=ResumeUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Upload and parse a resume PDF."""
    # Validate file type
    if not file.filename.endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are supported",
        )

    if file.size and file.size > 10 * 1024 * 1024:  # 10MB limit
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File size exceeds 10MB limit",
        )

    # Save uploaded file temporarily
    temp_path = None
    try:
        # Create temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            content = await file.read()
            tmp.write(content)
            temp_path = tmp.name

        # Parse resume
        try:
            parsed_data = parser.parse(temp_path)
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e),
            )

        # Upload to file storage
        try:
            s3_path = file_handler.upload_file(temp_path, str(current_user.id), file.filename)
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to save file: {str(e)}",
            )

        # Delete existing resume if present
        existing_resume = db.query(Resume).filter(Resume.user_id == current_user.id).first()
        if existing_resume:
            # Delete old file
            file_handler.delete_file(existing_resume.s3_file_path)
            db.delete(existing_resume)
            db.commit()

        # Save to database
        resume = Resume(
            user_id=current_user.id,
            filename=file.filename,
            s3_file_path=s3_path,
            parsed_data=parsed_data,
            raw_text=parsed_data.get("raw_text"),
        )
        db.add(resume)
        db.commit()
        db.refresh(resume)

        logger.info(f"Resume uploaded for user {current_user.id}: {file.filename}")

        return ResumeUploadResponse(
            id=resume.id,
            filename=resume.filename,
            s3_file_path=resume.s3_file_path,
            upload_date=resume.upload_date,
            parsed_data=ParsedResumeData(**parsed_data),
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading resume: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process resume",
        )
    finally:
        # Clean up temp file
        if temp_path and os.path.exists(temp_path):
            os.unlink(temp_path)


@router.get("/", response_model=ResumeResponse)
def get_resume(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get current user's resume."""
    resume = db.query(Resume).filter(Resume.user_id == current_user.id, Resume.is_active == True).first()

    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No resume found. Please upload a resume first.",
        )

    return ResumeResponse(
        id=resume.id,
        filename=resume.filename,
        s3_file_path=resume.s3_file_path,
        upload_date=resume.upload_date,
        parsed_data=ParsedResumeData(**resume.parsed_data),
        raw_text=resume.raw_text,
    )


@router.get("/parsed-data", response_model=ParsedResumeData)
def get_parsed_resume_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get parsed resume data only (without raw text)."""
    resume = db.query(Resume).filter(Resume.user_id == current_user.id, Resume.is_active == True).first()

    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No resume found",
        )

    return ParsedResumeData(**resume.parsed_data)


@router.delete("/", response_model=ResumeDeleteResponse)
def delete_resume(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete user's resume."""
    resume = db.query(Resume).filter(Resume.user_id == current_user.id, Resume.is_active == True).first()

    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No resume found",
        )

    # Delete from file storage
    try:
        file_handler.delete_file(resume.s3_file_path)
    except Exception as e:
        logger.warning(f"Failed to delete file from storage: {e}")

    # Delete from database
    db.delete(resume)
    db.commit()

    logger.info(f"Resume deleted for user {current_user.id}")

    return ResumeDeleteResponse(message="Resume deleted successfully")
