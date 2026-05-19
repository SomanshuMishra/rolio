import pdfplumber
import spacy
import re
from typing import Dict, List, Any, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

# Load spaCy model
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    logger.warning("spaCy model not found. Some features will be limited.")
    nlp = None


class ResumeParser:
    """Parse resume PDFs and extract structured data."""

    def __init__(self):
        self.nlp = nlp

    def extract_text_from_pdf(self, file_path: str) -> str:
        """Extract raw text from PDF file."""
        try:
            with pdfplumber.open(file_path) as pdf:
                text = ""
                for page in pdf.pages:
                    text += page.extract_text() or ""
                return text.strip()
        except Exception as e:
            logger.error(f"Error extracting text from PDF: {e}")
            raise ValueError(f"Unable to parse PDF: {str(e)}")

    def parse(self, file_path: str) -> Dict[str, Any]:
        """Parse resume and extract structured data."""
        # Extract raw text
        raw_text = self.extract_text_from_pdf(file_path)

        if not raw_text:
            raise ValueError("PDF appears to be empty or scanned (no text found)")

        # Extract sections
        parsed_data = {
            "name": self._extract_name(raw_text),
            "email": self._extract_email(raw_text),
            "phone": self._extract_phone(raw_text),
            "location": self._extract_location(raw_text),
            "summary": self._extract_summary(raw_text),
            "skills": self._extract_skills(raw_text),
            "languages": self._extract_languages(raw_text),
            "certifications": self._extract_certifications(raw_text),
            "experience": self._extract_experience(raw_text),
            "education": self._extract_education(raw_text),
        }

        return parsed_data

    def _extract_name(self, text: str) -> Optional[str]:
        """Extract name from resume (usually at top)."""
        if not self.nlp:
            return None

        doc = self.nlp(text[:500])  # First 500 chars
        for ent in doc.ents:
            if ent.label_ == "PERSON":
                return ent.text
        return None

    def _extract_email(self, text: str) -> Optional[str]:
        """Extract email address."""
        pattern = r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
        match = re.search(pattern, text)
        return match.group(0) if match else None

    def _extract_phone(self, text: str) -> Optional[str]:
        """Extract phone number."""
        # Matches: +1-555-0123, (555) 123-4567, 555.123.4567, 5551234567
        pattern = r"(?:\+1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}"
        match = re.search(pattern, text)
        return match.group(0).strip() if match else None

    def _extract_location(self, text: str) -> Optional[str]:
        """Extract location using spaCy NER."""
        if not self.nlp:
            return None

        doc = self.nlp(text[:1000])
        locations = [ent.text for ent in doc.ents if ent.label_ == "GPE"]
        return locations[0] if locations else None

    def _extract_summary(self, text: str) -> Optional[str]:
        """Extract professional summary."""
        # Look for "SUMMARY", "OBJECTIVE", "PROFILE" sections
        patterns = [
            r"(?:PROFESSIONAL\s+)?SUMMARY\s*\n(.{50,500}?)(?=\n[A-Z]|\Z)",
            r"OBJECTIVE\s*\n(.{50,500}?)(?=\n[A-Z]|\Z)",
            r"PROFILE\s*\n(.{50,500}?)(?=\n[A-Z]|\Z)",
        ]

        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
            if match:
                return match.group(1).strip()

        # Fallback: first 200 chars after name if no section found
        lines = text.split("\n")
        summary = " ".join(lines[2:5] if len(lines) > 4 else lines[:3])
        return summary.strip() if len(summary) > 20 else None

    def _extract_skills(self, text: str) -> List[str]:
        """Extract technical and soft skills."""
        skill_keywords = {
            # Programming languages
            "python", "java", "javascript", "typescript", "c++", "c#", "ruby",
            "go", "rust", "php", "swift", "kotlin", "scala", "r", "matlab",
            # Web
            "react", "angular", "vue", "node.js", "express", "django",
            "fastapi", "flask", "spring", "asp.net", "html", "css", "sass",
            # Databases
            "postgresql", "mysql", "mongodb", "dynamodb", "redis", "cassandra",
            "elasticsearch", "sql", "nosql", "oracle", "firebase",
            # Cloud & DevOps
            "aws", "azure", "gcp", "docker", "kubernetes", "jenkins", "cicd",
            "terraform", "ansible", "ec2", "s3", "lambda", "heroku",
            # Data
            "machine learning", "tensorflow", "pytorch", "numpy", "pandas",
            "spark", "hadoop", "etl", "data analysis", "sql", "analytics",
            # Other
            "git", "rest api", "graphql", "unix", "linux", "agile", "scrum",
            "jira", "confluence", "slack", "excel", "power bi", "tableau",
            "communication", "leadership", "problem solving", "teamwork",
        }

        found_skills = []
        text_lower = text.lower()

        for skill in skill_keywords:
            if re.search(r"\b" + skill + r"\b", text_lower):
                found_skills.append(skill.title())

        return list(set(found_skills))  # Remove duplicates

    def _extract_languages(self, text: str) -> List[str]:
        """Extract programming languages and natural languages."""
        languages = []
        language_list = [
            "English", "Spanish", "French", "German", "Mandarin", "Japanese",
            "Python", "Java", "JavaScript", "C++", "C#", "Go", "Rust",
            "Ruby", "PHP", "Swift", "Kotlin", "TypeScript", "SQL",
        ]

        for lang in language_list:
            if re.search(rf"\b{lang}\b", text, re.IGNORECASE):
                languages.append(lang)

        return languages

    def _extract_certifications(self, text: str) -> List[str]:
        """Extract certifications and awards."""
        cert_pattern = r"(?:Certifications?|Awards?|Licenses?)\s*\n((?:[^\n]*\n){1,10}?)(?=\n[A-Z]|\Z)"
        match = re.search(cert_pattern, text, re.IGNORECASE | re.DOTALL)

        if match:
            cert_text = match.group(1)
            certs = [line.strip().lstrip("•-*").strip() for line in cert_text.split("\n") if line.strip()]
            return [c for c in certs if len(c) > 5]

        return []

    def _extract_experience(self, text: str) -> List[Dict[str, Any]]:
        """Extract work experience entries."""
        # Look for EXPERIENCE or WORK EXPERIENCE section
        exp_pattern = r"(?:WORK\s+)?EXPERIENCE\s*\n(.*?)(?=\n[A-Z]{2,}|\Z)"
        match = re.search(exp_pattern, text, re.IGNORECASE | re.DOTALL)

        if not match:
            return []

        exp_text = match.group(1)
        experiences = []

        # Split by common patterns (company followed by role or date)
        entries = re.split(r"\n(?=[A-Z][a-z]+ (?:Inc|LLC|Ltd|Corp|\d{4})|\d{1,2}/\d{4})", exp_text)

        for entry in entries:
            if len(entry.strip()) < 30:
                continue

            lines = entry.strip().split("\n")
            if not lines:
                continue

            exp_dict = {
                "company": None,
                "role": None,
                "start_date": None,
                "end_date": None,
                "location": None,
                "description": None,
                "skills_used": [],
            }

            # Extract company (usually first line or line with company name)
            company_match = re.search(r"([A-Z][a-z\s&,.-]+(?:Inc|LLC|Ltd|Corp))", entry)
            if company_match:
                exp_dict["company"] = company_match.group(1).strip()

            # Extract dates
            date_pattern = r"(\d{1,2}/\d{4}|[A-Za-z]+ \d{4})"
            dates = re.findall(date_pattern, entry)
            if dates:
                exp_dict["start_date"] = dates[0]
                exp_dict["end_date"] = dates[1] if len(dates) > 1 else "Present"

            # Extract role (usually contains "Engineer", "Manager", "Developer", etc.)
            role_pattern = r"(.*?(?:Engineer|Manager|Developer|Analyst|Designer|Lead|Director|Specialist|Architect).*?)\n"
            role_match = re.search(role_pattern, entry, re.IGNORECASE)
            if role_match:
                exp_dict["role"] = role_match.group(1).strip()

            # Use first 2-3 bullet points as description
            bullets = re.findall(r"[•\-\*]\s*([^\n]{20,})", entry)
            if bullets:
                exp_dict["description"] = " ".join(bullets[:2])

            if exp_dict["company"] or exp_dict["role"]:
                experiences.append(exp_dict)

        return experiences

    def _extract_education(self, text: str) -> List[Dict[str, Any]]:
        """Extract education entries."""
        edu_pattern = r"(?:EDUCATION|ACADEMIC|TRAINING)\s*\n(.*?)(?=\n[A-Z]{2,}|\Z)"
        match = re.search(edu_pattern, text, re.IGNORECASE | re.DOTALL)

        if not match:
            return []

        edu_text = match.group(1)
        educations = []

        # Split by common university patterns
        entries = re.split(r"\n(?=[A-Z][a-z]+ (?:University|College|School|Institute))", edu_text)

        for entry in entries:
            if len(entry.strip()) < 20:
                continue

            edu_dict = {
                "degree": None,
                "field": None,
                "institution": None,
                "graduation_year": None,
                "gpa": None,
            }

            # Extract institution
            inst_match = re.search(r"([A-Z][a-z]+ (?:University|College|School|Institute)[^\n]*)", entry)
            if inst_match:
                edu_dict["institution"] = inst_match.group(1).strip()

            # Extract degree (Bachelor, Master, PhD, etc.)
            degree_match = re.search(
                r"(Bachelor|Master|Ph\.?D|Associate|Diploma|Certificate|B\.S|B\.A|M\.S|M\.A|MBA)",
                entry,
                re.IGNORECASE,
            )
            if degree_match:
                edu_dict["degree"] = degree_match.group(1)

            # Extract field of study
            field_match = re.search(
                r"(?:in|of)\s+([A-Za-z\s&-]+?)(?:\n|,|;|GPA|\d{4}|$)",
                entry,
                re.IGNORECASE,
            )
            if field_match:
                edu_dict["field"] = field_match.group(1).strip()

            # Extract graduation year
            year_match = re.search(r"(?:May|June|July|August|December|Graduation|Graduated|Class of)?\s*(\d{4})", entry)
            if year_match:
                edu_dict["graduation_year"] = int(year_match.group(1))

            # Extract GPA
            gpa_match = re.search(r"GPA\s*[:=]\s*(\d\.?\d*)", entry, re.IGNORECASE)
            if gpa_match:
                edu_dict["gpa"] = float(gpa_match.group(1))

            if edu_dict["institution"] or edu_dict["degree"]:
                educations.append(edu_dict)

        return educations
