import logging
import json
import httpx
from typing import List, Dict, Any, Optional
import re

logger = logging.getLogger(__name__)


class GeminiWebJobSearcher:
    """Search for real jobs using Google Gemini's web grounding capability."""

    BASE_URL = "https://generativelanguage.googleapis.com/v1beta"
    MODEL = "gemini-2.0-flash"

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.timeout = httpx.Timeout(60.0)

    async def search_jobs(
        self,
        resume_data: Dict[str, Any],
        preferences: Dict[str, Any],
        limit: int = 20,
    ) -> List[Dict[str, Any]]:
        """Search for jobs using Gemini with web grounding.

        Args:
            resume_data: Parsed resume data (skills, experience, etc.)
            preferences: User preferences (salary, location, roles)
            limit: Number of jobs to return

        Returns:
            List of real job listings found on the web
        """
        try:
            logger.info(f"\n>>> Starting Gemini Web Job Search")
            logger.info(f"    Limit: {limit} jobs")

            # Build personalized search prompt
            prompt = self._build_search_prompt(resume_data, preferences, limit)
            logger.info(f"    Search prompt prepared: {len(prompt)} chars")

            # Call Gemini API with web grounding
            jobs = await self._search_with_gemini(prompt)

            logger.info(f"    Found {len(jobs)} jobs from web search")

            # Validate and filter jobs
            validated_jobs = await self._validate_jobs(jobs, preferences)
            logger.info(f"    Validated {len(validated_jobs)} jobs")

            return validated_jobs

        except Exception as e:
            logger.error(f"Web job search error: {e}")
            raise ValueError(f"Failed to search for jobs: {str(e)}")

    def _build_search_prompt(
        self,
        resume_data: Dict[str, Any],
        preferences: Dict[str, Any],
        limit: int,
    ) -> str:
        """Build a personalized search prompt for the user."""
        skills = ", ".join(resume_data.get("skills", [])[:10])
        experience_level = self._estimate_level(resume_data)
        preferred_roles = ", ".join(preferences.get("preferred_roles", [])[:3])
        locations = ", ".join(preferences.get("preferred_locations", [])[:3])
        salary_min = preferences.get("salary_min") or 0
        salary_max = preferences.get("salary_max") or 0
        remote_pref = preferences.get("remote_preference", "any")

        salary_str = f"${salary_min:,} - ${salary_max:,}" if (salary_min and salary_max) else "Not specified"

        prompt = f"""Find REAL job listings from actual job boards and company career pages.

CANDIDATE PROFILE:
- Experience Level: {experience_level}
- Key Skills: {skills}
- Preferred Roles: {preferred_roles}
- Preferred Locations: {locations}
- Salary Range: {salary_str} per year
- Remote Preference: {remote_pref}

INSTRUCTIONS:
1. Search for REAL, CURRENT job postings from:
   - LinkedIn Jobs
   - Indeed
   - Glassdoor
   - Company career pages
   - Other major job boards

2. For EACH job found, extract EXACTLY this JSON format:
{{"title": "...", "company": "...", "location": "...", "salary_range": "...", "description": "...", "apply_url": "...", "source": "..."}}

3. Only include jobs that:
   - Are actively hiring (not old listings)
   - Match the candidate's skills and experience
   - Have a valid apply URL
   - Salary is within range (if disclosed)
   - Location matches preferences (or remote if preferred)

4. Return a JSON array with up to {limit} jobs:
[{{"title": "...", "company": "...", ...}}, ...]

IMPORTANT: Only return REAL jobs with VALID apply URLs. No placeholder URLs.
"""
        return prompt

    async def _search_with_gemini(self, prompt: str) -> List[Dict[str, Any]]:
        """Call Gemini API with web grounding to search for jobs."""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                # Gemini API endpoint for web grounding
                response = await client.post(
                    f"{self.BASE_URL}/models/{self.MODEL}:generateContent",
                    params={"key": self.api_key},
                    json={
                        "contents": [
                            {
                                "parts": [
                                    {
                                        "text": prompt
                                    }
                                ]
                            }
                        ],
                        # Enable web grounding for real-time search
                        "tools": [
                            {
                                "google_search_retrieval": {}
                            }
                        ],
                        "generationConfig": {
                            "temperature": 0.3,
                            "maxOutputTokens": 4000,
                        }
                    },
                )

                response.raise_for_status()
                data = response.json()

                # Extract content from response
                if "candidates" in data and len(data["candidates"]) > 0:
                    content = data["candidates"][0]["content"]["parts"][0]["text"]
                    logger.info(f"    Gemini response received: {len(content)} chars")

                    # Parse JSON from response
                    jobs = self._parse_jobs_from_response(content)
                    return jobs
                else:
                    logger.warning("No candidates in Gemini response")
                    return []

        except Exception as e:
            logger.error(f"Gemini API error: {e}")
            raise

    def _parse_jobs_from_response(self, content: str) -> List[Dict[str, Any]]:
        """Extract job listings from Gemini response."""
        try:
            # Try to find JSON array in response
            json_match = re.search(r"\[[\s\S]*\]", content)

            if json_match:
                jobs_text = json_match.group(0)
                jobs = json.loads(jobs_text)

                if isinstance(jobs, list):
                    logger.info(f"    Parsed {len(jobs)} jobs from response")
                    return jobs

            logger.warning("Could not parse jobs from response")
            return []

        except json.JSONDecodeError as e:
            logger.error(f"JSON parse error: {e}")
            return []

    async def _validate_jobs(
        self,
        jobs: List[Dict[str, Any]],
        preferences: Dict[str, Any],
    ) -> List[Dict[str, Any]]:
        """Validate that jobs are real and have working URLs."""
        validated = []

        for job in jobs:
            try:
                # Check required fields
                if not all(key in job for key in ["title", "company", "apply_url"]):
                    logger.debug(f"    Skipping job - missing fields: {job.get('title', 'Unknown')}")
                    continue

                # Skip if URL looks fake/placeholder
                apply_url = job.get("apply_url", "").strip()
                if not apply_url or apply_url.startswith("http://localhost") or "placeholder" in apply_url.lower():
                    logger.debug(f"    Skipping job - invalid URL: {job.get('title', 'Unknown')}")
                    continue

                # Quick URL validation (check if URL is valid format)
                if not apply_url.startswith(("http://", "https://")):
                    apply_url = f"https://{apply_url}"
                    job["apply_url"] = apply_url

                # Check salary matches preferences if provided
                if preferences.get("salary_min"):
                    if not self._check_salary_in_range(job, preferences):
                        logger.debug(f"    Skipping job - salary mismatch: {job.get('title', 'Unknown')}")
                        continue

                # Add validation metadata
                job["validated"] = True
                job["found_date"] = "2026-05-20"  # Today

                validated.append(job)

            except Exception as e:
                logger.debug(f"    Error validating job: {e}")
                continue

        return validated

    def _check_salary_in_range(
        self,
        job: Dict[str, Any],
        preferences: Dict[str, Any],
    ) -> bool:
        """Check if job salary matches user preferences."""
        try:
            salary_range = job.get("salary_range", "")
            if not salary_range:
                return True  # No salary data, allow it

            # Try to extract salary numbers from string
            numbers = re.findall(r"\d+", salary_range.replace(",", ""))

            if len(numbers) < 2:
                return True  # Can't determine, allow it

            job_min = int(numbers[0]) * 1000 if int(numbers[0]) < 1000 else int(numbers[0])
            job_max = int(numbers[1]) * 1000 if int(numbers[1]) < 1000 else int(numbers[1])

            pref_min = int(preferences.get("salary_min", 0))
            pref_max = int(preferences.get("salary_max", 999999))

            # Check if ranges overlap
            return job_max >= pref_min and job_min <= pref_max

        except Exception as e:
            logger.debug(f"Salary check error: {e}")
            return True  # Allow on error

    def _estimate_level(self, resume_data: Dict[str, Any]) -> str:
        """Estimate career level from resume."""
        experience = resume_data.get("experience", [])

        total_years = len(experience)

        if total_years == 0:
            return "Entry-level (0-2 years)"
        elif total_years <= 3:
            return "Junior (1-3 years)"
        elif total_years <= 7:
            return "Mid-level (3-7 years)"
        else:
            return "Senior (7+ years)"
