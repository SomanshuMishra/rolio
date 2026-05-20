import logging
import json
import uuid
from typing import List, Dict, Any, Optional
import httpx

logger = logging.getLogger(__name__)


async def fetch_remoteok_jobs(limit: int = 100) -> List[Dict[str, Any]]:
    """Fetch jobs from RemoteOK public API."""
    try:
        logger.info(f"Fetching jobs from RemoteOK API...")
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get("https://remoteok.com/api", headers=headers)
            response.raise_for_status()
            all_jobs = response.json()

        logger.info(f"  RemoteOK returned {len(all_jobs)} total items")

        jobs = []
        for job in all_jobs[:limit]:
            if not isinstance(job, dict) or "id" not in job:
                continue

            # RemoteOK uses 'position' not 'title', and 'slug' for URL
            job_dict = {
                "jsearch_id": f"remoteok_{job.get('id', uuid.uuid4())}",
                "title": job.get("position", job.get("title", "")),
                "company": job.get("company", ""),
                "location": job.get("location", "") or job.get("region", "") or "Remote",
                "is_remote": True,
                "salary_min": None,
                "salary_max": None,
                "description": job.get("description", "") or job.get("summary", ""),
                "requirements": [],
                "apply_url": f"https://remoteok.com/jobs/{job.get('slug', job.get('id'))}",
                "posted_at": job.get("date") or job.get("date_posted"),
                "source": "remoteok",
            }

            if job_dict["title"]:  # Only add if title exists
                jobs.append(job_dict)

        logger.info(f"✓ RemoteOK API returned {len(jobs)} valid jobs")
        return jobs

    except Exception as e:
        logger.error(f"Error fetching from RemoteOK: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return []


async def fetch_jsearch_smart_queries(
    ai_provider: str,
    api_key: str,
    resume_text: str,
    preferences: Dict[str, Any],
    limit: int = 30,
) -> List[Dict[str, Any]]:
    """Fetch jobs from JSearch using role-based queries."""
    from .jsearch_client import JSearchClient

    try:
        logger.info(f"Fetching from JSearch with smart queries...")

        roles = preferences.get("preferred_roles", [])
        locations = preferences.get("preferred_locations", [])

        # Generate simple search queries from roles
        queries = []
        for role in roles[:3]:
            queries.append(role)
            if "remote" in preferences.get("remote_preference", "").lower() or preferences.get("remote_preference") == "any":
                queries.append(f"{role} remote")

        if not queries:
            queries = ["software engineer", "software engineer remote"]

        logger.info(f"Generated queries: {queries}")

        jsearch = JSearchClient()
        all_jobs = []
        location = locations[0] if locations else None

        for query in queries[:5]:
            try:
                logger.info(f"  Searching JSearch for: {query}")
                jobs = await jsearch.search_jobs(
                    query=query,
                    location=location,
                    limit=limit // len(queries),
                )
                if jobs:
                    all_jobs.extend(jobs)
                    logger.info(f"    → Found {len(jobs)} jobs")
            except Exception as e:
                logger.error(f"  Error searching for '{query}': {e}")
                continue

        logger.info(f"✓ JSearch returned {len(all_jobs)} jobs")
        return all_jobs

    except Exception as e:
        logger.error(f"Error in JSearch: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return []


async def fetch_gemini_web_jobs(
    api_key: str,
    resume_text: str,
    preferences: Dict[str, Any],
    limit: int = 30,
) -> List[Dict[str, Any]]:
    """Use Gemini with web search grounding to find jobs."""
    try:
        from .web_job_searcher import GeminiWebJobSearcher

        logger.info(f"Searching web for jobs using Gemini web search...")
        searcher = GeminiWebJobSearcher(api_key)

        resume_data = {"text": resume_text}
        web_jobs = await searcher.search_jobs(
            resume_data=resume_data,
            preferences=preferences,
            limit=limit,
        )

        jobs = []
        if web_jobs:
            for web_job in web_jobs:
                jobs.append({
                    "jsearch_id": f"gemini_{uuid.uuid4()}",
                    "title": web_job.get("title", ""),
                    "company": web_job.get("company", ""),
                    "location": web_job.get("location", ""),
                    "is_remote": "remote" in (web_job.get("location", "") or "").lower(),
                    "salary_min": None,
                    "salary_max": None,
                    "description": web_job.get("description", ""),
                    "requirements": web_job.get("requirements", []) if isinstance(web_job.get("requirements"), list) else [],
                    "apply_url": web_job.get("apply_url", ""),
                    "posted_at": web_job.get("posted_date"),
                    "source": "gemini_web_search",
                })

        logger.info(f"✓ Gemini web search returned {len(jobs)} jobs")
        return jobs

    except Exception as e:
        logger.error(f"Error in Gemini web search: {str(e)}")
        return []


def merge_and_dedupe_jobs(
    remoteok_jobs: List[Dict[str, Any]],
    jsearch_jobs: List[Dict[str, Any]],
    gemini_jobs: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """Merge all job sources and dedupe by URL and company+title."""
    seen_urls = set()
    seen_company_title = set()
    merged = []

    all_jobs = remoteok_jobs + jsearch_jobs + gemini_jobs

    for job in all_jobs:
        url = job.get("apply_url", "")
        company = job.get("company", "").strip().lower()
        title = job.get("title", "").strip().lower()

        if url and url in seen_urls:
            continue

        company_title_key = f"{company}|{title}"
        if company and title and company_title_key in seen_company_title:
            continue

        if url:
            seen_urls.add(url)
        if company and title:
            seen_company_title.add(company_title_key)

        merged.append(job)

    logger.info(f"Merged and deduped: {len(remoteok_jobs)} RemoteOK + {len(jsearch_jobs)} JSearch + {len(gemini_jobs)} Gemini → {len(merged)} total")
    return merged


def extract_skills_from_resume(resume_text: str) -> List[str]:
    """Extract common skills from resume text."""
    skills_list = [
        "Python", "Java", "JavaScript", "TypeScript", "C++", "C#", "Go", "Rust",
        "Django", "Flask", "FastAPI", "React", "Vue", "Angular", "Next.js",
        "PostgreSQL", "MySQL", "MongoDB", "AWS", "Azure", "GCP", "Docker", "Kubernetes",
        "Node.js", "Express", "Spring Boot", "SQL", "Git", "REST", "GraphQL"
    ]

    found_skills = []
    resume_lower = resume_text.lower()

    for skill in skills_list:
        if skill.lower() in resume_lower:
            found_skills.append(skill)

    return found_skills
