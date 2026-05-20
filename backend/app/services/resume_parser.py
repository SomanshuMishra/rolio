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
    """Parse resume PDFs and extract structured data with robust error handling."""

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
        # Matches: +1-555-0123, (555) 123-4567, 555.123.4567, 5551234567, Indian format
        pattern = r"(?:\+\d{1,3}[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3,4}[-.\s]?[0-9]{3,4}"
        match = re.search(pattern, text)
        return match.group(0) if match else None

    def _extract_location(self, text: str) -> Optional[str]:
        """Extract location from text."""
        if not self.nlp:
            return None

        # Look for GPE (location) entities
        doc = self.nlp(text[:1000])
        locations = [ent.text for ent in doc.ents if ent.label_ == "GPE"]
        return locations[0] if locations else None

    def _extract_summary(self, text: str) -> Optional[str]:
        """Extract professional summary/objective."""
        # Look for SUMMARY, OBJECTIVE, or PROFESSIONAL PROFILE section
        patterns = [
            r"(?:PROFESSIONAL\s+)?SUMMARY\s*\n(.*?)(?=\n[A-Z]{2,}|\Z)",
            r"OBJECTIVE\s*\n(.*?)(?=\n[A-Z]{2,}|\Z)",
            r"PROFILE\s*\n(.*?)(?=\n[A-Z]{2,}|\Z)",
        ]

        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
            if match:
                summary_text = match.group(1).strip()
                # Take first 2-3 lines
                lines = [l.strip() for l in summary_text.split("\n") if l.strip()]
                return " ".join(lines[:3])

        # Fallback: extract from the beginning if no summary section found
        first_lines = text.split("\n")[:5]
        summary = " ".join([l for l in first_lines if len(l) > 20 and not re.match(r"^[A-Z\s]+$", l)])
        return summary[:200] if summary else None

    def _extract_skills(self, text: str) -> List[str]:
        """Extract technical skills - comprehensive list."""
        # Extended skill list
        skills_db = [
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

        found_skills = []
        text_lower = text.lower()

        for skill in skills_db:
            # Case-insensitive, word-boundary matching
            if re.search(r"\b" + re.escape(skill.lower()) + r"\b", text_lower):
                found_skills.append(skill)

        return list(set(found_skills))  # Remove duplicates

    def _extract_languages(self, text: str) -> List[str]:
        """Extract programming languages and natural languages."""
        languages = []
        language_list = [
            "English", "Spanish", "French", "German", "Mandarin", "Japanese", "Hindi",
            "Python", "Java", "JavaScript", "C++", "C#", "Go", "Rust", "Ruby", "PHP",
        ]

        for lang in language_list:
            if re.search(rf"\b{lang}\b", text, re.IGNORECASE):
                languages.append(lang)

        return languages

    def _extract_certifications(self, text: str) -> List[str]:
        """Extract certifications and awards."""
        # Look for CERTIFICATIONS section
        cert_pattern = r"(?:CERTIFICATIONS?|CREDENTIALS?|AWARDS?|LICENSES?)\s*\n((?:[^\n]*\n){1,20}?)(?=\n[A-Z]{2,}|\Z)"
        match = re.search(cert_pattern, text, re.IGNORECASE | re.DOTALL)

        if match:
            cert_text = match.group(1)
            certs = [line.strip().lstrip("•-*✓").strip() for line in cert_text.split("\n") if line.strip()]
            return [c for c in certs if len(c) > 5]

        return []

    def _extract_experience(self, text: str) -> List[Dict[str, Any]]:
        """Extract work experience entries - handles multiple formats."""
        # Try different section header patterns
        patterns = [
            r"(?:WORK\s+|PROFESSIONAL\s+)?EXPERIENCE\s*\n(.*?)(?=\n[A-Z]{2,}|\Z)",
            r"CAREER\s+HISTORY\s*\n(.*?)(?=\n[A-Z]{2,}|\Z)",
            r"EMPLOYMENT\s*\n(.*?)(?=\n[A-Z]{2,}|\Z)",
        ]

        exp_text = None
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
            if match:
                exp_text = match.group(1)
                break

        if not exp_text:
            return []

        experiences = []

        # Split by various patterns that indicate new job entry
        # Look for: Company names, dates, or job title patterns
        entries = re.split(
            r"\n(?=(?:[A-Z][a-z\s&,.-]*(?:Inc|LLC|Ltd|Corp|Company|Services|Solutions|Group)?|(?:Senior|Lead|Principal|Junior|Mid-level)\s+\w+|\d{1,2}[/-]\d{1,2}[/-]\d{2,4}))",
            exp_text,
            flags=re.IGNORECASE
        )

        for entry in entries:
            entry = entry.strip()
            if len(entry) < 30:
                continue

            exp_dict = {
                "company": self._extract_company_name(entry),
                "role": self._extract_job_title(entry),
                "start_date": None,
                "end_date": None,
                "location": None,
                "description": self._extract_job_description(entry),
                "skills_used": [],
            }

            # Extract dates
            dates = self._extract_dates(entry)
            if dates:
                exp_dict["start_date"] = dates[0]
                exp_dict["end_date"] = dates[1] if len(dates) > 1 else "Present"

            if exp_dict["company"] or exp_dict["role"]:
                experiences.append(exp_dict)

        return experiences

    def _extract_company_name(self, text: str) -> Optional[str]:
        """Extract company name from job entry."""
        # Patterns for company names
        patterns = [
            r"(?:^|\n)([A-Z][a-z\s&,.-]*(?:Inc|LLC|Ltd|Corp|Company|Services|Solutions|Group))",
            r"(?:at|@|worked at)\s+([A-Z][a-zA-Z\s&,.-]+?)(?:\n|\s{2,}|$)",
            r"^([A-Z][a-zA-Z\s&,.-]{3,})(?:\n|$)",
        ]

        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip()

        return None

    def _extract_job_title(self, text: str) -> Optional[str]:
        """Extract job title from entry."""
        # Common job title patterns
        role_keywords = [
            "Engineer", "Developer", "Manager", "Analyst", "Designer", "Lead", "Director",
            "Specialist", "Architect", "Scientist", "Administrator", "Consultant", "Executive",
            "Officer", "Coordinator", "Associate"
        ]

        for keyword in role_keywords:
            pattern = rf"((?:Senior|Junior|Lead|Principal|Mid-level)?\s*\w*\s*{keyword}.*?)(?:\n|\s{2,}|$)"
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip()

        # Fallback: first line might be the role
        first_line = text.split("\n")[0].strip()
        if len(first_line) > 5 and len(first_line) < 100:
            return first_line

        return None

    def _extract_dates(self, text: str) -> List[str]:
        """Extract start and end dates."""
        # Multiple date formats: MM/YYYY, Month YYYY, 2020-2021, etc.
        date_pattern = r"(\d{1,2}[/-]\d{4}|[A-Za-z]+ \d{4}|\d{4})"
        dates = re.findall(date_pattern, text)

        # Filter out single years and keep only proper dates
        dates = [d for d in dates if re.search(r"[/-]|\w+\s+\d", d)]

        return dates[:2] if dates else []

    def _extract_job_description(self, text: str) -> Optional[str]:
        """Extract job description/achievements."""
        # Get bullet points or achievements
        bullets = re.findall(r"[•\-\*]\s*([^\n]{20,})", text)

        if bullets:
            return " ".join(bullets[:2])

        # Fallback: get text after job title
        lines = [l.strip() for l in text.split("\n") if l.strip()]
        desc_lines = [l for l in lines[1:] if len(l) > 20 and not re.match(r"^\d", l)]
        return " ".join(desc_lines[:2]) if desc_lines else None

    def _extract_education(self, text: str) -> List[Dict[str, Any]]:
        """Extract education entries."""
        edu_pattern = r"(?:EDUCATION|ACADEMIC|TRAINING|QUALIFICATIONS?)\s*\n(.*?)(?=\n[A-Z]{2,}|\Z)"
        match = re.search(edu_pattern, text, re.IGNORECASE | re.DOTALL)

        if not match:
            return []

        edu_text = match.group(1)
        educations = []

        # Split by common patterns
        entries = re.split(r"\n(?=[A-Z][a-z]+\s+(?:University|College|Institute|School)|\w+\s+(?:Bachelor|Master|Associate|Diploma))", edu_text)

        for entry in entries:
            entry = entry.strip()
            if len(entry) < 10:
                continue

            edu_dict = {
                "degree": None,
                "field": None,
                "institution": None,
                "graduation_year": None,
                "gpa": None,
            }

            # Extract degree (Bachelor, Master, PhD, etc.)
            degree_match = re.search(r"(Bachelor|Master|PhD|Associate|Diploma|Certificate)(?:'s)?(?:\s+(?:of|in)\s+)?(\w+)?", entry, re.IGNORECASE)
            if degree_match:
                edu_dict["degree"] = degree_match.group(1)
                if degree_match.group(2):
                    edu_dict["field"] = degree_match.group(2)

            # Extract institution
            institution_match = re.search(r"(?:from|at)?\s*([A-Z][a-zA-Z\s&,.-]*(?:University|College|Institute|School))", entry, re.IGNORECASE)
            if institution_match:
                edu_dict["institution"] = institution_match.group(1).strip()

            # Extract year
            year_match = re.search(r"(20\d{2}|19\d{2})", entry)
            if year_match:
                edu_dict["graduation_year"] = year_match.group(1)

            # Extract GPA
            gpa_match = re.search(r"(?:GPA|Grade)[\s:]+(\d\.\d{1,2})", entry, re.IGNORECASE)
            if gpa_match:
                edu_dict["gpa"] = gpa_match.group(1)

            if edu_dict["degree"] or edu_dict["institution"]:
                educations.append(edu_dict)

        return educations
