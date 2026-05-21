from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    # Database - Use SQLite for development, PostgreSQL for production
    DATABASE_URL: str = "sqlite:///./backend.db"

    # JWT
    SECRET_KEY: str = "change-this-in-production-use-at-least-32-chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # AWS S3
    AWS_ACCESS_KEY_ID: str = "local-dev"
    AWS_SECRET_ACCESS_KEY: str = "local-dev"
    AWS_S3_BUCKET_NAME: str = "auto-apply-jobs-resumes-local"
    AWS_S3_REGION: str = "us-east-1"

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:8000",
        "http://localhost:8001",
        "https://rolio.in",
        "https://www.rolio.in",
        "https://api.rolio.in",
    ]

    # Environment
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # JSearch API
    JSEARCH_API_KEY: str = ""
    JSEARCH_API_HOST: str = "jsearch.p.rapidapi.com"

    # Redis
    REDIS_URL: str = "redis://localhost:6379"

    # Firebase (for Google Sign-In)
    FIREBASE_PROJECT_ID: str = ""
    FIREBASE_SERVICE_ACCOUNT_KEY: str = ""  # JSON string of service account credentials
    ALLOW_GOOGLE_AUTO_SIGNUP: bool = True

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
