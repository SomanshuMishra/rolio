import logging
from typing import List, Dict, Any
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import re

from .ai_provider import get_ai_provider

logger = logging.getLogger(__name__)

# Skills database from resume_parser
SKILLS_DATABASE = [
    # Languages
    "Python", "Java", "JavaScript", "TypeScript", "C++", "C#", "Go", "Rust", "Ruby", "PHP",
    "Swift", "Kotlin", "Scala", "Groovy", "R", "MATLAB", "SQL", "Bash", "Shell",
    # Web Frameworks
    "Django", "Flask", "FastAPI", "Spring", "Spring Boot", "Express", "React", "Vue", "Angular",
    "Next.js", "Svelte", "Rails", "Laravel", "ASP.NET", "Blazor",
    # Databases
    "PostgreSQL", "MySQL", "MongoDB", "Redis", "Cassandra", "DynamoDB", "Elasticsearch",
    "Oracle", "SQL Server", "MariaDB", "Firebase", "GraphQL",
    # Cloud & DevOps
    "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Jenkins", "GitLab", "GitHub", "CircleCI",
    "Travis CI", "Terraform", "Ansible", "CloudFormation", "EC2", "S3", "Lambda",
    # Tools & Libraries
    "Git", "REST API", "GraphQL", "Microservices", "Celery", "RabbitMQ", "Kafka",
    "NumPy", "Pandas", "Scikit-learn", "TensorFlow", "PyTorch", "OpenCV",
    "HTML", "CSS", "Sass", "Bootstrap", "Tailwind", "Material UI",
    # Other
    "AI", "ML", "Machine Learning", "Deep Learning", "NLP", "Data Science",
    "Big Data", "Spark", "Hadoop", "ETL", "CI/CD", "Agile", "Scrum",
]


class JobMatcher:
    """Match jobs to candidates using AI embeddings and scoring."""

    def __init__(self, ai_provider_name: str, api_key: str):
        """Initialize matcher with AI provider."""
        self.ai_provider = get_ai_provider(ai_provider_name, api_key)

    async def match_jobs(
        self,
        resume_data: Dict[str, Any],
        jobs: List[Dict[str, Any]],
        preferences: Dict[str, Any],
        required_skills: List[str] = None,
    ) -> List[Dict[str, Any]]:
        """Match jobs to candidate and return ranked list with scores.

        Args:
            resume_data: Parsed resume data
            jobs: List of job listings
            preferences: User preferences (salary, location, remote, etc.)
            required_skills: Optional list of required skills to filter jobs

        Returns:
            List of matched jobs with scores, sorted by match quality
        """
        try:
            matches = []

            logger.info(f"\n>>> Starting job matching for {len(jobs)} jobs")
            if required_skills:
                logger.info(f"    Filtering by required skills: {required_skills}")

            # Generate resume embedding
            resume_text = self._format_resume_for_embedding(resume_data)
            logger.info(f"    Resume text for embedding ({len(resume_text)} chars): {resume_text[:100]}...")

            resume_embedding = await self.ai_provider.get_embedding(resume_text)
            logger.info(f"    Resume embedding generated: {len(resume_embedding)} dimensions")

            for i, job in enumerate(jobs):
                logger.info(f"\n    Job {i+1}/{len(jobs)}: {job.get('title', 'Unknown')} at {job.get('company', 'Unknown')}")

                # Skip if job doesn't meet basic criteria
                if not self._meets_hard_filters(job, preferences):
                    logger.info(f"      ⊘ Skipped (doesn't meet hard filters)")
                    continue

                # Skip if required skills filter is set and job doesn't have any required skills
                if required_skills:
                    job_skills = self._extract_skills_from_job(job)
                    if not any(skill.lower() in [s.lower() for s in job_skills] for skill in required_skills):
                        logger.info(f"      ⊘ Skipped (doesn't match required skills: {required_skills})")
                        continue

                try:
                    # Generate job embedding
                    job_text = self._format_job_for_embedding(job)
                    job_embedding = await self.ai_provider.get_embedding(job_text)
                    logger.info(f"      ✓ Job embedding generated")

                    # Calculate similarity
                    similarity = cosine_similarity(
                        [resume_embedding],
                        [job_embedding],
                    )[0][0]

                    # Normalize to 0-100 scale
                    base_score = (similarity + 1) / 2 * 100
                    logger.info(f"      • Embedding similarity: {base_score:.1f}")

                    # Apply AI analysis for detailed reasoning
                    analysis = await self.ai_provider.analyze_match(resume_data, job)
                    logger.info(f"      ✓ AI analysis complete: {len(analysis.get('reasons', []))} reasons")

                    # Combine scores
                    final_score = self._calculate_final_score(
                        base_score,
                        analysis,
                        job,
                        preferences,
                    )

                    logger.info(f"      → Final score: {final_score:.1f}")

                    if final_score > 0:  # Only include non-zero matches
                        matches.append(
                            {
                                "job": job,
                                "match_score": round(final_score, 1),
                                "embedding_score": round(similarity * 100, 1),
                                "match_reasons": analysis.get("reasons", []),
                                "matching_skills": analysis.get("matching_skills", []),
                                "salary_match": self._check_salary_match(job, preferences),
                                "location_match": self._check_location_match(job, preferences),
                            }
                        )

                except Exception as e:
                    logger.warning(f"Error matching job {job.get('title')}: {e}")
                    continue

            # Sort by score descending
            matches.sort(key=lambda x: x["match_score"], reverse=True)

            logger.info(f"Generated {len(matches)} job matches")
            return matches

        except Exception as e:
            logger.error(f"Error in job matching: {e}")
            raise

    def _meets_hard_filters(
        self,
        job: Dict[str, Any],
        preferences: Dict[str, Any],
    ) -> bool:
        """Check if job meets hard filters (quick elimination)."""
        job_location = job.get("location", "").lower()
        job_title = job.get("title", "").lower()
        job_description = job.get("description", "").lower()
        is_job_remote = job.get("is_remote", False) or "remote" in job_location or "remote" in job_title or "remote" in job_description

        # Location filter - check if job is remote or matches preferred locations
        if preferences.get("preferred_locations"):
            preferred_locs = [loc.lower() for loc in preferences["preferred_locations"]]

            # Allow if job is remote
            if not is_job_remote:
                # Otherwise check if location matches preferences
                if not any(pref in job_location for pref in preferred_locs):
                    return False

        # Salary filter
        if preferences.get("salary_min"):
            job_max = job.get("salary_max")
            if job_max and job_max < int(preferences.get("salary_min", 0)):
                return False

        if preferences.get("salary_max"):
            job_min = job.get("salary_min")
            if job_min and job_min > int(preferences.get("salary_max", 999999)):
                return False

        # Remote preference filter
        if preferences.get("remote_preference") == "remote":
            if not is_job_remote:
                return False

        return True

    def _calculate_final_score(
        self,
        base_score: float,
        analysis: Dict[str, Any],
        job: Dict[str, Any],
        preferences: Dict[str, Any],
    ) -> float:
        """Calculate final match score with multipliers."""
        score = base_score * 0.6  # 60% weight on embedding similarity

        # Add analysis score (40% weight) - default to 70 if not provided (more optimistic)
        analysis_score = analysis.get("match_score", 70)
        score += (analysis_score * 0.4)

        # Apply multipliers for skills match
        matching_skills = analysis.get("matching_skills", [])
        if matching_skills:
            skills_multiplier = min(len(matching_skills) / 5, 1.2)  # Up to 20% boost
            score *= skills_multiplier

        # Apply confidence penalty (but not too harsh - we don't always have all data)
        role_confidence = analysis.get("role_match_confidence", 0.75)
        score *= role_confidence

        # Apply location penalty
        if not self._check_location_match(job, preferences):
            score *= 0.85  # 15% penalty

        # Apply salary penalty
        if not self._check_salary_match(job, preferences):
            score *= 0.9  # 10% penalty

        # Clamp to 0-100
        return max(0, min(100, score))

    def _check_salary_match(
        self,
        job: Dict[str, Any],
        preferences: Dict[str, Any],
    ) -> bool:
        """Check if job salary matches preferences."""
        if not preferences.get("salary_min"):
            return True  # No preference set

        job_min = job.get("salary_min")
        job_max = job.get("salary_max")

        if not job_min or not job_max:
            return True  # No salary data available

        pref_min = int(preferences.get("salary_min", 0))
        pref_max = int(preferences.get("salary_max", 999999))

        # Check if ranges overlap
        return job_max >= pref_min and job_min <= pref_max

    def _check_location_match(
        self,
        job: Dict[str, Any],
        preferences: Dict[str, Any],
    ) -> bool:
        """Check if job location matches preferences."""
        if not preferences.get("preferred_locations"):
            return True  # No preference set

        if job.get("is_remote"):
            return True  # Remote matches any location preference

        job_location = job.get("location", "").lower()
        preferred_locs = [loc.lower() for loc in preferences["preferred_locations"]]

        return any(pref in job_location for pref in preferred_locs)

    def _format_resume_for_embedding(self, resume_data: Dict[str, Any]) -> str:
        """Format resume for embedding generation."""
        parts = []

        if resume_data.get("summary"):
            parts.append(f"Professional Summary: {resume_data['summary']}")

        if resume_data.get("skills"):
            parts.append(f"Skills: {', '.join(resume_data['skills'][:20])}")

        if resume_data.get("experience"):
            parts.append("Work Experience:")
            for exp in resume_data["experience"][:5]:
                parts.append(
                    f"- {exp.get('role')} at {exp.get('company')} "
                    f"({exp.get('start_date')} to {exp.get('end_date')})"
                )

        if resume_data.get("education"):
            parts.append("Education:")
            for edu in resume_data["education"]:
                parts.append(
                    f"- {edu.get('degree')} in {edu.get('field')} "
                    f"from {edu.get('institution')}"
                )

        if resume_data.get("certifications"):
            parts.append(f"Certifications: {', '.join(resume_data['certifications'][:5])}")

        return "\n".join(parts)

    def _extract_skills_from_job(self, job: Dict[str, Any]) -> List[str]:
        """Extract technical skills from job description and requirements."""
        found_skills = []
        combined_text = ""

        # Combine job description, title, and requirements
        if job.get("title"):
            combined_text += job.get("title", "") + " "
        if job.get("description"):
            combined_text += job.get("description", "") + " "
        if job.get("requirements"):
            if isinstance(job.get("requirements"), list):
                combined_text += " ".join(job.get("requirements", []))
            else:
                combined_text += str(job.get("requirements", ""))

        combined_text_lower = combined_text.lower()

        # Search for skills using word boundaries
        for skill in SKILLS_DATABASE:
            if re.search(r"\b" + re.escape(skill.lower()) + r"\b", combined_text_lower):
                found_skills.append(skill)

        return list(set(found_skills))  # Remove duplicates

    def _format_job_for_embedding(self, job: Dict[str, Any]) -> str:
        """Format job for embedding generation."""
        parts = [
            f"Job Title: {job.get('title')}",
            f"Company: {job.get('company')}",
            f"Location: {job.get('location')}",
            f"Remote: {job.get('is_remote')}",
        ]

        if job.get("salary_min"):
            parts.append(
                f"Salary Range: ${job.get('salary_min')} - ${job.get('salary_max')}"
            )

        if job.get("description"):
            parts.append(f"Job Description: {job.get('description')[:1000]}")

        if job.get("requirements"):
            parts.append(f"Requirements: {', '.join(job.get('requirements', [])[:10])}")

        return "\n".join(parts)
