import httpx
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from urllib.parse import quote

from ..models import Job
from ..config import settings

logger = logging.getLogger(__name__)


class JSearchClient:
    """RapidAPI JSearch API client for fetching job listings."""

    BASE_URL = "https://jsearch.p.rapidapi.com"
    ENDPOINTS = {
        "search": "/search",
    }

    def __init__(self):
        self.api_key = settings.JSEARCH_API_KEY
        self.api_host = settings.JSEARCH_API_HOST
        self.timeout = httpx.Timeout(30.0)

        if not self.api_key:
            logger.warning("JSearch API key not configured. Job search will not work.")

    def _get_headers(self) -> Dict[str, str]:
        """Get headers for RapidAPI requests."""
        return {
            "x-rapidapi-key": self.api_key,
            "x-rapidapi-host": self.api_host,
        }

    async def search_jobs(
        self,
        query: str,
        location: str = None,
        job_type: str = None,
        remote: str = None,
        limit: int = 10,
    ) -> List[Dict[str, Any]]:
        """Search for jobs using JSearch API.

        Args:
            query: Job title or keyword (e.g., "Python Developer")
            location: Job location (e.g., "San Francisco, CA" or "Remote")
            job_type: Type of job (e.g., "PERMANENT", "CONTRACT", "PART_TIME")
            remote: Remote preference ("true", "false")
            limit: Number of results to return

        Returns:
            List of job dictionaries
        """
        if not self.api_key:
            raise ValueError("JSearch API key not configured")

        try:
            # Build search query
            search_query = query
            if location:
                search_query += f" {location}"

            # Build request parameters
            params = {
                "query": search_query,
                "page": "1",
                "num_pages": "1",
            }

            if job_type:
                params["employment_type"] = job_type
            if remote:
                params["remote_jobs_only"] = remote

            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{self.BASE_URL}{self.ENDPOINTS['search']}",
                    params=params,
                    headers=self._get_headers(),
                )

                if response.status_code == 429:
                    raise ValueError("JSearch API rate limit exceeded")
                elif response.status_code == 403:
                    raise ValueError("JSearch API key invalid or quota exceeded")
                elif response.status_code != 200:
                    logger.error(f"JSearch API error: {response.status_code} - {response.text}")
                    raise ValueError(f"JSearch API error: {response.status_code}")

                data = response.json()
                jobs = data.get("data", [])

                # Transform JSearch response to our format
                formatted_jobs = [self._format_job(job) for job in jobs[:limit]]
                logger.info(f"Retrieved {len(formatted_jobs)} jobs from JSearch")

                return formatted_jobs

        except Exception as e:
            logger.error(f"JSearch search error: {e}")
            raise

    def _format_job(self, raw_job: Dict[str, Any]) -> Dict[str, Any]:
        """Transform JSearch job data to our internal format."""
        return {
            "jsearch_id": raw_job.get("job_id"),
            "title": raw_job.get("job_title"),
            "company": raw_job.get("employer_name"),
            "location": self._format_location(raw_job),
            "is_remote": raw_job.get("job_is_you_will_be_remote", False),
            "salary_min": self._extract_salary_min(raw_job),
            "salary_max": self._extract_salary_max(raw_job),
            "description": raw_job.get("job_description"),
            "requirements": self._extract_requirements(raw_job),
            "apply_url": raw_job.get("job_apply_link") or raw_job.get("job_apply_is_direct_link_to_job_post"),
            "posted_at": self._parse_date(raw_job.get("job_posted_at_datetime_utc")),
            "source": "jsearch",
        }

    def _format_location(self, job: Dict[str, Any]) -> str:
        """Format location from job data."""
        city = job.get("job_city", "")
        state = job.get("job_state", "")
        country = job.get("job_country", "")

        parts = [p for p in [city, state, country] if p]
        return ", ".join(parts) if parts else "Unknown"

    def _extract_salary_min(self, job: Dict[str, Any]) -> Optional[int]:
        """Extract minimum salary."""
        try:
            salary_min = job.get("job_salary_period")
            if salary_min and isinstance(salary_min, (int, float)):
                return int(salary_min)
            return None
        except (ValueError, TypeError):
            return None

    def _extract_salary_max(self, job: Dict[str, Any]) -> Optional[int]:
        """Extract maximum salary."""
        try:
            salary_max = job.get("job_salary_period")
            if salary_max and isinstance(salary_max, (int, float)):
                return int(salary_max)
            return None
        except (ValueError, TypeError):
            return None

    def _extract_requirements(self, job: Dict[str, Any]) -> List[str]:
        """Extract job requirements/skills."""
        requirements = []

        # Try to parse requirements from description
        description = job.get("job_description", "")
        if description:
            # Extract common tech skills mentioned
            skills = [
                "Python", "Java", "JavaScript", "TypeScript", "React", "Node.js",
                "PostgreSQL", "MongoDB", "AWS", "Docker", "Kubernetes", "FastAPI",
                "Django", "Spring", "Angular", "Vue", "SQL", "REST API", "GraphQL",
            ]

            for skill in skills:
                if skill.lower() in description.lower():
                    requirements.append(skill)

        return requirements[:10]  # Limit to top 10

    def _parse_date(self, date_str: Optional[str]) -> Optional[datetime]:
        """Parse date string from JSearch."""
        if not date_str:
            return None

        try:
            # JSearch returns ISO format dates
            return datetime.fromisoformat(date_str.replace("Z", "+00:00"))
        except Exception:
            return None


async def cache_jobs(
    db: Session,
    jobs: List[Dict[str, Any]],
    ttl_hours: int = 24,
) -> None:
    """Cache jobs in database with TTL."""
    try:
        now = datetime.utcnow()
        expires_at = now + timedelta(hours=ttl_hours)

        for job_data in jobs:
            # Check if job already cached
            existing = db.query(Job).filter(
                Job.jsearch_id == job_data["jsearch_id"]
            ).first()

            if existing:
                # Update expiration
                existing.expires_at = expires_at
            else:
                # Create new cache entry
                job = Job(
                    jsearch_id=job_data["jsearch_id"],
                    title=job_data.get("title"),
                    company=job_data.get("company"),
                    location=job_data.get("location"),
                    is_remote=job_data.get("is_remote", False),
                    salary_min=job_data.get("salary_min"),
                    salary_max=job_data.get("salary_max"),
                    description=job_data.get("description"),
                    requirements=job_data.get("requirements", []),
                    apply_url=job_data.get("apply_url"),
                    posted_at=job_data.get("posted_at"),
                    source="jsearch",
                    cached_at=now,
                    expires_at=expires_at,
                )
                db.add(job)

        db.commit()
        logger.info(f"Cached {len(jobs)} jobs")

    except Exception as e:
        logger.error(f"Error caching jobs: {e}")
        db.rollback()
        raise


def get_non_expired_jobs(
    db: Session,
    limit: int = 50,
) -> List[Job]:
    """Get non-expired jobs from cache."""
    try:
        now = datetime.utcnow()
        jobs = (
            db.query(Job)
            .filter(Job.expires_at > now)
            .order_by(Job.cached_at.desc())
            .limit(limit)
            .all()
        )
        return jobs
    except Exception as e:
        logger.error(f"Error retrieving cached jobs: {e}")
        return []


def cleanup_expired_jobs(db: Session) -> int:
    """Delete expired jobs from cache."""
    try:
        now = datetime.utcnow()
        count = db.query(Job).filter(Job.expires_at < now).delete()
        db.commit()
        logger.info(f"Cleaned up {count} expired jobs")
        return count
    except Exception as e:
        logger.error(f"Error cleaning up expired jobs: {e}")
        db.rollback()
        return 0
