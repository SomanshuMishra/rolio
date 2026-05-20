import logging
import threading
import json
from datetime import datetime
from typing import Dict, Any
from sqlalchemy.orm import Session

from ..database import SessionLocal
from ..models import JobSearch, User, UserJobMatch, Job, Resume, UserPreferences, APIKey
from ..utils.security import decrypt_api_key
from .job_matcher import JobMatcher
from .job_discovery import fetch_remoteok_jobs, fetch_jsearch_smart_queries, fetch_gemini_web_jobs, merge_and_dedupe_jobs
from .jsearch_client import cache_jobs, cleanup_expired_jobs

logger = logging.getLogger(__name__)


async def search_jobs_async(search_id: str, user_id: str, filters: Dict[str, Any]):
    """Background task to search jobs asynchronously."""
    db = SessionLocal()

    try:
        # Update status to in_progress
        search = db.query(JobSearch).filter(JobSearch.id == search_id).first()
        if not search:
            logger.error(f"Search {search_id} not found")
            return

        search.status = "in_progress"
        db.commit()

        logger.info(f"Starting async job search {search_id} for user {user_id}")

        # Get user data
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise Exception("User not found")

        resume = db.query(Resume).filter(
            Resume.user_id == user_id,
            Resume.is_active == True,
        ).first()

        if not resume:
            raise Exception("No resume found")

        preferences = db.query(UserPreferences).filter(
            UserPreferences.user_id == user_id,
        ).first()

        if not preferences:
            raise Exception("No preferences found")

        # Get default API key
        api_key_record = db.query(APIKey).filter(
            APIKey.user_id == user_id,
            APIKey.is_default == True,
        ).first()

        if not api_key_record:
            api_key_record = db.query(APIKey).filter(
                APIKey.user_id == user_id,
            ).order_by(APIKey.created_at.desc()).first()

        if not api_key_record:
            raise Exception("No API key found")

        api_key = decrypt_api_key(api_key_record.encrypted_key)

        # Clean up expired cache
        cleanup_expired_jobs(db)

        # Fetch jobs from multiple sources
        logger.info(f"Fetching jobs from multiple sources...")

        remoteok_jobs = await fetch_remoteok_jobs(limit=60)
        jsearch_jobs = await fetch_jsearch_smart_queries(
            api_key_record.provider,
            api_key,
            resume.raw_text or "",
            {
                "preferred_roles": preferences.preferred_roles.split(",") if preferences.preferred_roles else [],
                "preferred_locations": preferences.preferred_locations.split(",") if preferences.preferred_locations else [],
                "remote_preference": preferences.remote_preference,
            },
            limit=60,
        )

        gemini_jobs = []
        if api_key_record.provider == "google":
            gemini_jobs = await fetch_gemini_web_jobs(
                api_key,
                resume.raw_text or "",
                {
                    "preferred_roles": preferences.preferred_roles.split(",") if preferences.preferred_roles else [],
                    "preferred_locations": preferences.preferred_locations.split(",") if preferences.preferred_locations else [],
                    "remote_preference": preferences.remote_preference,
                },
                limit=60,
            )

        # Merge and dedupe
        merged_jobs = merge_and_dedupe_jobs(remoteok_jobs, jsearch_jobs, gemini_jobs)

        if merged_jobs:
            await cache_jobs(db, merged_jobs)

        logger.info(f"Found {len(merged_jobs)} total jobs, matching...")

        # Match jobs
        import json as json_module
        parsed_resume = json_module.loads(resume.parsed_data) if isinstance(resume.parsed_data, str) else resume.parsed_data

        matcher = JobMatcher(api_key_record.provider, api_key)

        preferences_dict = {
            "preferred_roles": preferences.preferred_roles.split(",") if preferences.preferred_roles else [],
            "preferred_locations": preferences.preferred_locations.split(",") if preferences.preferred_locations else [],
            "salary_min": preferences.salary_min,
            "salary_max": preferences.salary_max,
            "remote_preference": preferences.remote_preference,
        }

        # Limit to 30 jobs for faster matching
        jobs_to_match = merged_jobs[:min(30, len(merged_jobs))]

        matches = await matcher.match_jobs(
            parsed_resume,
            jobs_to_match,
            preferences_dict,
            required_skills=filters.get("required_skills"),
        )

        logger.info(f"Got {len(matches)} matches, storing in database...")

        # Store matches
        match_count = 0
        for match in matches[:50]:  # Store top 50 matches
            job = db.query(Job).filter(Job.jsearch_id == match["job"]["jsearch_id"]).first()

            if not job:
                requirements = match["job"].get("requirements", [])
                requirements_str = ",".join(str(r).strip() for r in requirements if r) if requirements else ""

                job = Job(
                    jsearch_id=match["job"]["jsearch_id"],
                    title=match["job"].get("title"),
                    company=match["job"].get("company"),
                    location=match["job"].get("location"),
                    is_remote=match["job"].get("is_remote", False),
                    salary_min=match["job"].get("salary_min"),
                    salary_max=match["job"].get("salary_max"),
                    description=match["job"].get("description"),
                    requirements=requirements_str,
                    apply_url=match["job"].get("apply_url"),
                    posted_at=match["job"].get("posted_at"),
                    source="async_search",
                )
                db.add(job)
                db.flush()

            # Create match record
            existing_match = db.query(UserJobMatch).filter(
                UserJobMatch.user_id == user_id,
                UserJobMatch.job_id == job.id,
            ).first()

            match_reasons_dict = {"reasons": match["match_reasons"]}
            match_reasons_json = json.dumps(match_reasons_dict)

            if existing_match:
                existing_match.match_score = match["match_score"]
                existing_match.match_reasons = match_reasons_json
                existing_match.embedding_score = match["embedding_score"]
            else:
                user_job_match = UserJobMatch(
                    user_id=user_id,
                    job_id=job.id,
                    match_score=match["match_score"],
                    match_reasons=match_reasons_json,
                    embedding_score=match["embedding_score"],
                    salary_match=match.get("salary_match", True),
                    location_match=match.get("location_match", True),
                )
                db.add(user_job_match)

            match_count += 1

        db.commit()

        # Update search record
        search.status = "completed"
        search.total_jobs_searched = len(merged_jobs)
        search.total_matches = match_count
        search.completed_at = datetime.utcnow()
        db.commit()

        logger.info(f"✓ Async search {search_id} completed: {match_count} matches")

    except Exception as e:
        logger.error(f"Error in async job search: {str(e)}")
        search = db.query(JobSearch).filter(JobSearch.id == search_id).first()
        if search:
            search.status = "failed"
            db.commit()
    finally:
        db.close()


def start_background_search(search_id: str, user_id: str, filters: Dict[str, Any]):
    """Start async job search in background thread."""
    thread = threading.Thread(
        target=lambda: __import__('asyncio').run(search_jobs_async(search_id, user_id, filters)),
        daemon=True,
    )
    thread.start()
