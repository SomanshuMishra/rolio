from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
import logging
import time
import uuid

from ..database import get_db
from ..models import User, Resume, UserPreferences, APIKey, UserJobMatch, UserJobAction, Job
from ..schemas.job import (
    JobSearchRequest,
    JobSearchResponse,
    JobMatchResult,
    JobMatches,
    JobMatchWithAction,
)
from ..utils.deps import get_current_user
from ..utils.security import decrypt_api_key
from ..services.jsearch_client import JSearchClient, cache_jobs, get_non_expired_jobs, cleanup_expired_jobs
from ..services.job_matcher import JobMatcher

router = APIRouter(prefix="/jobs", tags=["jobs"])
logger = logging.getLogger(__name__)


@router.post("/search", response_model=JobSearchResponse, status_code=status.HTTP_200_OK)
async def search_and_match_jobs(
    request: JobSearchRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Trigger AI-powered job search and matching."""
    start_time = time.time()

    try:
        # Check user has resume
        resume = db.query(Resume).filter(
            Resume.user_id == current_user.id,
            Resume.is_active == True,
        ).first()

        if not resume:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No resume uploaded. Please upload a resume first.",
            )

        # Get user preferences
        preferences = db.query(UserPreferences).filter(
            UserPreferences.user_id == current_user.id,
        ).first()

        if not preferences:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No preferences set. Please set your job preferences first.",
            )

        # Get user's API key
        api_key_record = db.query(APIKey).filter(
            APIKey.user_id == current_user.id,
        ).first()

        if not api_key_record:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No AI provider API key configured. Please add your OpenAI or Claude API key.",
            )

        # Decrypt API key
        api_key = decrypt_api_key(api_key_record.encrypted_key)
        if not api_key:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to decrypt API key",
            )

        # Clean up expired cache
        cleanup_expired_jobs(db)

        # Get or fetch jobs
        jobs = []
        if not request.force_refresh:
            # Try to get from cache first
            cached_jobs = get_non_expired_jobs(db, limit=request.limit * 5)
            jobs = [
                {
                    "jsearch_id": j.jsearch_id,
                    "title": j.title,
                    "company": j.company,
                    "location": j.location,
                    "is_remote": j.is_remote,
                    "salary_min": j.salary_min,
                    "salary_max": j.salary_max,
                    "description": j.description,
                    "requirements": j.requirements or [],
                    "apply_url": j.apply_url,
                    "posted_at": j.posted_at,
                }
                for j in cached_jobs
            ]

        # If not enough cached jobs, fetch from API
        if len(jobs) < request.limit * 2:
            try:
                jsearch = JSearchClient()

                # Build search query
                query = preferences.preferred_roles[0] if preferences.preferred_roles else "software engineer"
                location = preferences.preferred_locations[0] if preferences.preferred_locations else None

                api_jobs = await jsearch.search_jobs(
                    query=query,
                    location=location,
                    limit=request.limit * 3,
                )

                # Cache the jobs
                if api_jobs:
                    cache_jobs(db, api_jobs)
                    jobs.extend(api_jobs)

            except Exception as e:
                logger.error(f"Error fetching from JSearch: {e}")
                if not jobs:
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail=f"Failed to fetch jobs: {str(e)}",
                    )

        if not jobs:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No jobs found. Try adjusting your preferences.",
            )

        # Match jobs using AI
        matcher = JobMatcher(api_key_record.provider, api_key)

        preferences_dict = {
            "preferred_roles": preferences.preferred_roles or [],
            "preferred_locations": preferences.preferred_locations or [],
            "salary_min": preferences.salary_min,
            "salary_max": preferences.salary_max,
            "remote_preference": preferences.remote_preference,
        }

        matches = await matcher.match_jobs(
            resume.parsed_data,
            jobs[:request.limit * 2],
            preferences_dict,
        )

        # Store matches in database
        for match in matches[:request.limit]:
            # Get or create job record
            job = db.query(Job).filter(Job.jsearch_id == match["job"]["jsearch_id"]).first()

            if not job:
                job = Job(
                    jsearch_id=match["job"]["jsearch_id"],
                    title=match["job"].get("title"),
                    company=match["job"].get("company"),
                    location=match["job"].get("location"),
                    is_remote=match["job"].get("is_remote", False),
                    salary_min=match["job"].get("salary_min"),
                    salary_max=match["job"].get("salary_max"),
                    description=match["job"].get("description"),
                    requirements=match["job"].get("requirements", []),
                    apply_url=match["job"].get("apply_url"),
                    posted_at=match["job"].get("posted_at"),
                    source="jsearch",
                )
                db.add(job)
                db.flush()

            # Create or update match record
            existing_match = db.query(UserJobMatch).filter(
                UserJobMatch.user_id == current_user.id,
                UserJobMatch.job_id == job.id,
            ).first()

            if existing_match:
                existing_match.match_score = match["match_score"]
                existing_match.match_reasons = {"reasons": match["match_reasons"]}
                existing_match.embedding_score = match["embedding_score"]
            else:
                user_job_match = UserJobMatch(
                    user_id=current_user.id,
                    job_id=job.id,
                    match_score=match["match_score"],
                    match_reasons={"reasons": match["match_reasons"]},
                    embedding_score=match["embedding_score"],
                    salary_match=match.get("salary_match", True),
                    location_match=match.get("location_match", True),
                )
                db.add(user_job_match)

        db.commit()

        # Convert matches to response format
        response_jobs = []
        for match in matches[:request.limit]:
            response_jobs.append(
                JobMatchResult(
                    id=uuid.uuid4(),
                    jsearch_id=match["job"]["jsearch_id"],
                    title=match["job"].get("title"),
                    company=match["job"].get("company"),
                    location=match["job"].get("location"),
                    is_remote=match["job"].get("is_remote", False),
                    salary_min=match["job"].get("salary_min"),
                    salary_max=match["job"].get("salary_max"),
                    description=match["job"].get("description"),
                    apply_url=match["job"].get("apply_url"),
                    posted_at=match["job"].get("posted_at"),
                    match_score=match["match_score"],
                    match_reasons=match["match_reasons"],
                    matching_skills=match.get("matching_skills", []),
                    salary_match=match.get("salary_match", True),
                    location_match=match.get("location_match", True),
                )
            )

        processing_time = int((time.time() - start_time) * 1000)

        return JobSearchResponse(
            search_id=str(uuid.uuid4()),
            total_matches=len(matches),
            matches_returned=len(response_jobs),
            processing_time_ms=processing_time,
            jobs=response_jobs,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in job search: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Job search failed: {str(e)}",
        )


@router.get("/matches", response_model=JobMatches)
def get_job_matches(
    limit: int = 20,
    offset: int = 0,
    min_score: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get user's saved job matches."""
    try:
        # Query matches
        query = db.query(UserJobMatch).filter(
            UserJobMatch.user_id == current_user.id,
            UserJobMatch.match_score >= min_score,
        )

        total = query.count()

        matches = (
            query.order_by(UserJobMatch.match_score.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )

        result_matches = []
        for match in matches:
            # Get job details
            job = db.query(Job).filter(Job.id == match.job_id).first()
            if not job:
                continue

            # Get user action if exists
            action = db.query(UserJobAction).filter(
                UserJobAction.user_id == current_user.id,
                UserJobAction.job_id == match.job_id,
            ).first()

            result_matches.append(
                JobMatchWithAction(
                    match_id=match.id,
                    job=JobMatchResult(
                        id=job.id,
                        jsearch_id=job.jsearch_id,
                        title=job.title,
                        company=job.company,
                        location=job.location,
                        is_remote=job.is_remote,
                        salary_min=job.salary_min,
                        salary_max=job.salary_max,
                        description=job.description,
                        apply_url=job.apply_url,
                        posted_at=job.posted_at,
                        match_score=match.match_score,
                        match_reasons=match.match_reasons.get("reasons", []) if match.match_reasons else [],
                        salary_match=match.salary_match,
                        location_match=match.location_match,
                    ),
                    match_score=match.match_score,
                    match_reasons=match.match_reasons.get("reasons", []) if match.match_reasons else [],
                    user_action=action.action if action else None,
                    created_at=match.created_at,
                )
            )

        return JobMatches(total=total, limit=limit, offset=offset, matches=result_matches)

    except Exception as e:
        logger.error(f"Error fetching matches: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch matches",
        )


@router.post("/jobs/{job_id}/save")
def save_job(
    job_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Save a job to user's saved list."""
    try:
        # Get job
        job = db.query(Job).filter(Job.jsearch_id == job_id).first()

        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job not found",
            )

        # Check if already saved
        existing_action = db.query(UserJobAction).filter(
            UserJobAction.user_id == current_user.id,
            UserJobAction.job_id == job.id,
            UserJobAction.action == "saved",
        ).first()

        if existing_action:
            return {"message": "Job already saved", "action": "saved", "job_id": job.id}

        # Create action record
        action = UserJobAction(
            user_id=current_user.id,
            job_id=job.id,
            action="saved",
        )
        db.add(action)
        db.commit()

        logger.info(f"User {current_user.id} saved job {job_id}")

        return {"message": "Job saved", "action": "saved", "job_id": job.id}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error saving job: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save job",
        )


@router.post("/jobs/{job_id}/dismiss")
def dismiss_job(
    job_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Dismiss a job (don't show similar matches)."""
    try:
        # Get job
        job = db.query(Job).filter(Job.jsearch_id == job_id).first()

        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job not found",
            )

        # Check if already dismissed
        existing_action = db.query(UserJobAction).filter(
            UserJobAction.user_id == current_user.id,
            UserJobAction.job_id == job.id,
            UserJobAction.action == "dismissed",
        ).first()

        if existing_action:
            return {"message": "Job already dismissed", "action": "dismissed", "job_id": job.id}

        # Remove from saved if exists
        saved_action = db.query(UserJobAction).filter(
            UserJobAction.user_id == current_user.id,
            UserJobAction.job_id == job.id,
            UserJobAction.action == "saved",
        ).first()

        if saved_action:
            db.delete(saved_action)

        # Create dismiss action
        action = UserJobAction(
            user_id=current_user.id,
            job_id=job.id,
            action="dismissed",
        )
        db.add(action)
        db.commit()

        logger.info(f"User {current_user.id} dismissed job {job_id}")

        return {"message": "Job dismissed", "action": "dismissed", "job_id": job.id}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error dismissing job: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to dismiss job",
        )


@router.post("/jobs/{job_id}/apply")
def apply_to_job(
    job_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mark a job as applied and get apply link."""
    try:
        # Get job
        job = db.query(Job).filter(Job.jsearch_id == job_id).first()

        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job not found",
            )

        # Check if already applied
        existing_action = db.query(UserJobAction).filter(
            UserJobAction.user_id == current_user.id,
            UserJobAction.job_id == job.id,
            UserJobAction.action == "applied",
        ).first()

        if existing_action:
            return {
                "message": "Already marked as applied",
                "action": "applied",
                "job_id": job.id,
                "apply_url": job.apply_url,
            }

        # Create apply action
        action = UserJobAction(
            user_id=current_user.id,
            job_id=job.id,
            action="applied",
        )
        db.add(action)

        # Remove from dismissed if was dismissed
        dismissed_action = db.query(UserJobAction).filter(
            UserJobAction.user_id == current_user.id,
            UserJobAction.job_id == job.id,
            UserJobAction.action == "dismissed",
        ).first()

        if dismissed_action:
            db.delete(dismissed_action)

        db.commit()

        logger.info(f"User {current_user.id} applied to job {job_id}")

        return {
            "message": "Job marked as applied",
            "action": "applied",
            "job_id": job.id,
            "apply_url": job.apply_url,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error applying to job: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to apply to job",
        )
