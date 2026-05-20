from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
import logging
import httpx
import json
import re

logger = logging.getLogger(__name__)


class AIProvider(ABC):
    """Abstract base class for AI providers."""

    def __init__(self, api_key: str, model: str = None):
        self.api_key = api_key
        self.model = model
        self.timeout = httpx.Timeout(30.0)

    @abstractmethod
    async def get_embedding(self, text: str) -> List[float]:
        """Get embedding vector for text."""
        pass

    @abstractmethod
    async def analyze_match(
        self,
        resume_data: Dict[str, Any],
        job_data: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Analyze job match and return score + reasons."""
        pass

    async def search_jobs_web(
        self,
        resume_text: str,
        preferences: Dict[str, Any],
    ) -> List[Dict[str, Any]]:
        """Search for jobs using web search (only available for Gemini)."""
        raise NotImplementedError("Web search not available for this provider")

    def _format_resume(self, resume_data: Dict[str, Any]) -> str:
        """Format resume data for analysis."""
        lines = []
        if resume_data.get("summary"):
            lines.append(f"Summary: {resume_data['summary']}")
        if resume_data.get("skills"):
            lines.append(f"Skills: {', '.join(resume_data['skills'][:15])}")
        if resume_data.get("experience"):
            lines.append("\nWork Experience:")
            for exp in resume_data["experience"][:3]:
                lines.append(f"- {exp.get('role')} at {exp.get('company')}")
        if resume_data.get("education"):
            lines.append("\nEducation:")
            for edu in resume_data["education"][:2]:
                lines.append(f"- {edu.get('degree')} in {edu.get('field')}")

        return "\n".join(lines)

    def _format_job(self, job_data: Dict[str, Any]) -> str:
        """Format job data for analysis."""
        lines = [
            f"Title: {job_data.get('title')}",
            f"Company: {job_data.get('company')}",
            f"Location: {job_data.get('location')}",
            f"Remote: {job_data.get('is_remote')}",
        ]
        if job_data.get("salary_min"):
            lines.append(f"Salary: ${job_data.get('salary_min')} - ${job_data.get('salary_max')}")
        if job_data.get("description"):
            lines.append(f"\nDescription: {job_data.get('description')[:500]}")
        if job_data.get("requirements"):
            lines.append(f"\nKey Requirements: {', '.join(job_data.get('requirements', [])[:10])}")

        return "\n".join(lines)

    def _parse_json_response(self, content: str) -> Dict[str, Any]:
        """Parse JSON from AI response, handling wrapped responses."""
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            json_match = re.search(r"\{.*\}", content, re.DOTALL)
            if json_match:
                return json.loads(json_match.group(0))
            raise ValueError("Could not parse JSON from response")

    def _tfidf_embedding(self, text: str) -> List[float]:
        """Generate TF-IDF-based deterministic embedding (1536 dimensions)."""
        # Simple character frequency-based embedding (deterministic)
        text_lower = text.lower()
        chars = {}
        for char in text_lower:
            if char.isalnum():
                chars[char] = chars.get(char, 0) + 1

        # Create 1536-dim vector from character frequencies
        embedding = []
        total = len(text_lower) if text_lower else 1

        # Use ASCII values and frequencies to generate embedding
        for i in range(1536):
            char_idx = i % len(chars) if chars else 0
            char = list(chars.keys())[char_idx] if chars else 'a'
            freq = chars.get(char, 0) / total
            # Mix frequency with position and character value
            value = (freq * 0.5 + (ord(char) % 256) / 256.0 * 0.3 + (i / 1536.0) * 0.2)
            embedding.append(float(value) - 0.5)  # Normalize to roughly [-0.5, 0.5]

        return embedding


class OpenAIProvider(AIProvider):
    """OpenAI API provider."""

    BASE_URL = "https://api.openai.com/v1"
    EMBEDDING_MODEL = "text-embedding-3-small"
    ANALYSIS_MODEL = "gpt-4-turbo"

    async def get_embedding(self, text: str) -> List[float]:
        """Get embedding from OpenAI."""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.BASE_URL}/embeddings",
                    headers={"Authorization": f"Bearer {self.api_key}"},
                    json={
                        "input": text[:8000],
                        "model": self.EMBEDDING_MODEL,
                    },
                )
                response.raise_for_status()
                data = response.json()
                return data["data"][0]["embedding"]
        except Exception as e:
            logger.error(f"OpenAI embedding error: {e}")
            raise ValueError(f"Failed to get embedding from OpenAI: {str(e)}")

    async def analyze_match(
        self,
        resume_data: Dict[str, Any],
        job_data: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Analyze job match using GPT-4."""
        try:
            resume_text = self._format_resume(resume_data)
            job_text = self._format_job(job_data)

            prompt = f"""Analyze how well this resume matches this job posting.

RESUME:
{resume_text}

JOB POSTING:
{job_text}

Provide a JSON response with:
1. match_score (0-100): Overall match percentage
2. matching_skills: List of matching technical skills
3. role_match_confidence (0-1): How well role matches experience
4. location_penalty (0-1): Penalty if location doesn't match (0 = perfect match)
5. salary_penalty (0-1): Penalty if salary expectations don't match (0 = perfect match)
6. reasons: List of 3-5 key reasons for the score

Response format: {{"match_score": 85, "matching_skills": [...], "role_match_confidence": 0.92, ...}}"""

            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.BASE_URL}/chat/completions",
                    headers={"Authorization": f"Bearer {self.api_key}"},
                    json={
                        "model": self.ANALYSIS_MODEL,
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": 0.3,
                        "max_tokens": 500,
                    },
                )
                response.raise_for_status()
                data = response.json()
                content = data["choices"][0]["message"]["content"]
                return self._parse_json_response(content)

        except Exception as e:
            logger.error(f"OpenAI analysis error: {e}")
            raise ValueError(f"Failed to analyze match with OpenAI: {str(e)}")


class AnthropicProvider(AIProvider):
    """Anthropic Claude API provider."""

    BASE_URL = "https://api.anthropic.com/v1"
    ANALYSIS_MODEL = "claude-3-haiku-20240307"

    async def get_embedding(self, text: str) -> List[float]:
        """Get embedding using TF-IDF (Anthropic has no embedding API)."""
        try:
            return await self._tfidf_embedding(text)
        except Exception as e:
            logger.error(f"Anthropic embedding error: {e}")
            raise ValueError(f"Failed to get embedding from Anthropic: {str(e)}")

    async def analyze_match(
        self,
        resume_data: Dict[str, Any],
        job_data: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Analyze job match using Claude."""
        try:
            resume_text = self._format_resume(resume_data)
            job_text = self._format_job(job_data)

            prompt = f"""Analyze how well this resume matches this job posting.

RESUME:
{resume_text}

JOB POSTING:
{job_text}

Provide a JSON response with:
1. match_score (0-100): Overall match percentage
2. matching_skills: List of matching technical skills
3. role_match_confidence (0-1): How well role matches experience
4. location_penalty (0-1): Penalty if location doesn't match
5. salary_penalty (0-1): Penalty if salary doesn't match
6. reasons: List of 3-5 key reasons

Response format: {{"match_score": 85, "matching_skills": [...], ...}}"""

            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.BASE_URL}/messages",
                    headers={
                        "x-api-key": self.api_key,
                        "anthropic-version": "2023-06-01",
                    },
                    json={
                        "model": self.ANALYSIS_MODEL,
                        "max_tokens": 500,
                        "messages": [{"role": "user", "content": prompt}],
                    },
                )
                response.raise_for_status()
                data = response.json()
                content = data["content"][0]["text"]
                return self._parse_json_response(content)

        except Exception as e:
            logger.error(f"Claude analysis error: {e}")
            raise ValueError(f"Failed to analyze match with Claude: {str(e)}")

    async def _tfidf_embedding(self, text: str) -> List[float]:
        """Generate TF-IDF embedding."""
        try:
            from sklearn.feature_extraction.text import TfidfVectorizer

            # Create a simple embedding from text using TF-IDF
            # For single text, we create a deterministic vector based on character frequencies
            text_lower = text.lower()
            chars = {}
            for c in text_lower:
                if c.isalnum():
                    chars[c] = chars.get(c, 0) + 1

            # Create 1536-dim embedding (same as OpenAI)
            embedding = [0.0] * 1536
            for i, (char, count) in enumerate(sorted(chars.items())):
                if i < 1536:
                    embedding[i] = min(count / 10.0, 1.0)  # Normalize

            return embedding[:1536]
        except Exception as e:
            logger.error(f"TF-IDF embedding error: {e}")
            raise


class GoogleGeminiProvider(AIProvider):
    """Google Gemini API provider with real embeddings and web search."""

    BASE_URL = "https://generativelanguage.googleapis.com/v1beta"
    EMBEDDING_MODEL = "text-embedding-004"
    ANALYSIS_MODEL = "gemini-1.5-flash"

    async def get_embedding(self, text: str) -> List[float]:
        """Get embedding from Google Gemini, fallback to TF-IDF if API fails."""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.BASE_URL}/models/{self.EMBEDDING_MODEL}:embedContent?key={self.api_key}",
                    json={
                        "model": f"models/{self.EMBEDDING_MODEL}",
                        "content": {"parts": [{"text": text[:8000]}]},
                    },
                )
                response.raise_for_status()
                data = response.json()
                return data["embedding"]["values"]
        except Exception as e:
            logger.warning(f"Gemini embedding API failed ({type(e).__name__}), using TF-IDF fallback")
            # Fallback to TF-IDF embedding
            return self._tfidf_embedding(text)

    async def analyze_match(
        self,
        resume_data: Dict[str, Any],
        job_data: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Analyze job match using Gemini 1.5 Flash."""
        try:
            resume_text = self._format_resume(resume_data)
            job_text = self._format_job(job_data)

            prompt = f"""Analyze how well this resume matches this job posting.

RESUME:
{resume_text}

JOB POSTING:
{job_text}

Provide a JSON response with:
1. match_score (0-100): Overall match percentage
2. matching_skills: List of matching technical skills
3. role_match_confidence (0-1): How well role matches experience
4. location_penalty (0-1): Penalty if location doesn't match
5. salary_penalty (0-1): Penalty if salary doesn't match
6. reasons: List of 3-5 key reasons

Response format: {{"match_score": 85, "matching_skills": [...], ...}}"""

            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.BASE_URL}/models/{self.ANALYSIS_MODEL}:generateContent?key={self.api_key}",
                    json={
                        "contents": [{"parts": [{"text": prompt}]}],
                        "generationConfig": {"temperature": 0.3, "maxOutputTokens": 500},
                    },
                )
                response.raise_for_status()
                data = response.json()
                content = data["candidates"][0]["content"]["parts"][0]["text"]
                return self._parse_json_response(content)

        except Exception as e:
            logger.error(f"Gemini analysis error: {e}")
            raise ValueError(f"Failed to analyze match with Gemini: {str(e)}")

    async def search_jobs_web(
        self,
        resume_text: str,
        preferences: Dict[str, Any],
    ) -> List[Dict[str, Any]]:
        """Search for jobs using Gemini with web search grounding."""
        try:
            role = preferences.get("preferred_roles", ["Developer"])[0]
            location = preferences.get("preferred_locations", ["Remote"])[0]

            prompt = f"""Find 20 job listings for a {role} in {location}.
Search for actual current job postings on job boards and LinkedIn.

Return ONLY a JSON array with this structure:
[{{"title": "Job Title", "company": "Company Name", "location": "Location", "url": "job_url", "salary": "salary_range or null", "description": "brief description"}}]

Include only real, current job postings with working URLs."""

            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.BASE_URL}/models/{self.ANALYSIS_MODEL}:generateContent?key={self.api_key}",
                    json={
                        "contents": [{"parts": [{"text": prompt}]}],
                        "tools": [
                            {
                                "googleSearch": {}
                            }
                        ],
                        "generationConfig": {"temperature": 0.3, "maxOutputTokens": 2000},
                    },
                )
                response.raise_for_status()
                data = response.json()
                content = data["candidates"][0]["content"]["parts"][0]["text"]

                # Parse JSON array from response
                json_match = re.search(r"\[.*\]", content, re.DOTALL)
                if json_match:
                    jobs = json.loads(json_match.group(0))
                    return jobs[:20]
                return []

        except Exception as e:
            logger.error(f"Gemini web search error: {e}")
            return []


class GroqProvider(AIProvider):
    """Groq API provider (OpenAI-compatible)."""

    BASE_URL = "https://api.groq.com/openai/v1"
    ANALYSIS_MODEL = "llama-3.1-8b-instant"

    async def get_embedding(self, text: str) -> List[float]:
        """Get embedding using TF-IDF (Groq has no embedding API)."""
        try:
            from sklearn.feature_extraction.text import TfidfVectorizer

            text_lower = text.lower()
            chars = {}
            for c in text_lower:
                if c.isalnum():
                    chars[c] = chars.get(c, 0) + 1

            embedding = [0.0] * 1536
            for i, (char, count) in enumerate(sorted(chars.items())):
                if i < 1536:
                    embedding[i] = min(count / 10.0, 1.0)

            return embedding[:1536]
        except Exception as e:
            logger.error(f"Groq embedding error: {e}")
            raise ValueError(f"Failed to get embedding from Groq: {str(e)}")

    async def analyze_match(
        self,
        resume_data: Dict[str, Any],
        job_data: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Analyze job match using Groq."""
        try:
            resume_text = self._format_resume(resume_data)
            job_text = self._format_job(job_data)

            prompt = f"""Analyze how well this resume matches this job posting.

RESUME:
{resume_text}

JOB POSTING:
{job_text}

Provide a JSON response with:
1. match_score (0-100): Overall match percentage
2. matching_skills: List of matching technical skills
3. role_match_confidence (0-1): How well role matches experience
4. location_penalty (0-1): Penalty if location doesn't match
5. salary_penalty (0-1): Penalty if salary doesn't match
6. reasons: List of 3-5 key reasons

Response format: {{"match_score": 85, "matching_skills": [...], ...}}"""

            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.BASE_URL}/chat/completions",
                    headers={"Authorization": f"Bearer {self.api_key}"},
                    json={
                        "model": self.ANALYSIS_MODEL,
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": 0.3,
                        "max_tokens": 500,
                    },
                )
                response.raise_for_status()
                data = response.json()
                content = data["choices"][0]["message"]["content"]
                return self._parse_json_response(content)

        except Exception as e:
            logger.error(f"Groq analysis error: {e}")
            raise ValueError(f"Failed to analyze match with Groq: {str(e)}")


class GrokProvider(AIProvider):
    """X.AI Grok provider (OpenAI-compatible)."""

    BASE_URL = "https://api.x.ai/v1"
    ANALYSIS_MODEL = "grok-beta"

    async def get_embedding(self, text: str) -> List[float]:
        """Get embedding using TF-IDF (Grok has no embedding API)."""
        try:
            text_lower = text.lower()
            chars = {}
            for c in text_lower:
                if c.isalnum():
                    chars[c] = chars.get(c, 0) + 1

            embedding = [0.0] * 1536
            for i, (char, count) in enumerate(sorted(chars.items())):
                if i < 1536:
                    embedding[i] = min(count / 10.0, 1.0)

            return embedding[:1536]
        except Exception as e:
            logger.error(f"Grok embedding error: {e}")
            raise ValueError(f"Failed to get embedding from Grok: {str(e)}")

    async def analyze_match(
        self,
        resume_data: Dict[str, Any],
        job_data: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Analyze job match using Grok."""
        try:
            resume_text = self._format_resume(resume_data)
            job_text = self._format_job(job_data)

            prompt = f"""Analyze how well this resume matches this job posting.

RESUME:
{resume_text}

JOB POSTING:
{job_text}

Provide a JSON response with:
1. match_score (0-100): Overall match percentage
2. matching_skills: List of matching technical skills
3. role_match_confidence (0-1): How well role matches experience
4. location_penalty (0-1): Penalty if location doesn't match
5. salary_penalty (0-1): Penalty if salary doesn't match
6. reasons: List of 3-5 key reasons

Response format: {{"match_score": 85, "matching_skills": [...], ...}}"""

            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.BASE_URL}/chat/completions",
                    headers={"Authorization": f"Bearer {self.api_key}"},
                    json={
                        "model": self.ANALYSIS_MODEL,
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": 0.3,
                        "max_tokens": 500,
                    },
                )
                response.raise_for_status()
                data = response.json()
                content = data["choices"][0]["message"]["content"]
                return self._parse_json_response(content)

        except Exception as e:
            logger.error(f"Grok analysis error: {e}")
            raise ValueError(f"Failed to analyze match with Grok: {str(e)}")


def get_ai_provider(provider: str, api_key: str, model: str = None) -> AIProvider:
    """Factory function to get AI provider instance."""
    provider_lower = provider.lower()

    if provider_lower == "openai":
        return OpenAIProvider(api_key, model or OpenAIProvider.ANALYSIS_MODEL)
    elif provider_lower == "anthropic":
        return AnthropicProvider(api_key, model or AnthropicProvider.ANALYSIS_MODEL)
    elif provider_lower == "google":
        return GoogleGeminiProvider(api_key, model or GoogleGeminiProvider.ANALYSIS_MODEL)
    elif provider_lower == "groq":
        return GroqProvider(api_key, model or GroqProvider.ANALYSIS_MODEL)
    elif provider_lower == "grok":
        return GrokProvider(api_key, model or GrokProvider.ANALYSIS_MODEL)
    else:
        raise ValueError(f"Unsupported AI provider: {provider}")
