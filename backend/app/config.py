from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://auto_apply_user:auto_apply_dev_password@localhost:5432/auto_apply_jobs_db"

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
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:8000"]

    # Environment
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # JSearch API
    JSEARCH_API_KEY: str = ""
    JSEARCH_API_HOST: str = "jsearch.p.rapidapi.com"

    # Redis
    REDIS_URL: str = "redis://localhost:6379"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
