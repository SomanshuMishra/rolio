import boto3
import logging
import uuid
from typing import Optional
from ..config import settings

logger = logging.getLogger(__name__)


class S3FileHandler:
    """Handle file uploads and downloads from AWS S3."""

    def __init__(self):
        self.s3_client = boto3.client(
            "s3",
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_S3_REGION,
        )
        self.bucket = settings.AWS_S3_BUCKET_NAME

    def upload_file(self, file_path: str, user_id: str, original_filename: str) -> str:
        """Upload file to S3 and return S3 path."""
        try:
            # Generate unique S3 key
            file_ext = original_filename.split(".")[-1]
            s3_key = f"resumes/{user_id}/{uuid.uuid4()}.{file_ext}"

            # Upload file
            self.s3_client.upload_file(
                file_path,
                self.bucket,
                s3_key,
                ExtraArgs={
                    "ContentType": "application/pdf",
                    "Metadata": {
                        "user_id": user_id,
                        "original_filename": original_filename,
                    },
                },
            )

            logger.info(f"Uploaded file to S3: {s3_key}")
            return s3_key

        except Exception as e:
            logger.error(f"Error uploading file to S3: {e}")
            raise ValueError(f"Failed to upload file: {str(e)}")

    def download_file(self, s3_path: str, local_path: str) -> bool:
        """Download file from S3 to local path."""
        try:
            self.s3_client.download_file(self.bucket, s3_path, local_path)
            logger.info(f"Downloaded file from S3: {s3_path}")
            return True
        except Exception as e:
            logger.error(f"Error downloading file from S3: {e}")
            return False

    def delete_file(self, s3_path: str) -> bool:
        """Delete file from S3."""
        try:
            self.s3_client.delete_object(Bucket=self.bucket, Key=s3_path)
            logger.info(f"Deleted file from S3: {s3_path}")
            return True
        except Exception as e:
            logger.error(f"Error deleting file from S3: {e}")
            return False

    def get_file_url(self, s3_path: str, expiration: int = 3600) -> str:
        """Generate pre-signed URL for file access."""
        try:
            url = self.s3_client.generate_presigned_url(
                "get_object",
                Params={"Bucket": self.bucket, "Key": s3_path},
                ExpiresIn=expiration,
            )
            return url
        except Exception as e:
            logger.error(f"Error generating pre-signed URL: {e}")
            return ""


class LocalFileHandler:
    """Handle file uploads to local filesystem (for development)."""

    def __init__(self, base_path: str = "resumes"):
        self.base_path = base_path
        import os

        os.makedirs(base_path, exist_ok=True)

    def upload_file(self, file_path: str, user_id: str, original_filename: str) -> str:
        """Save file to local filesystem and return relative path."""
        import os
        import shutil

        try:
            user_dir = os.path.join(self.base_path, user_id)
            os.makedirs(user_dir, exist_ok=True)

            # Generate unique filename
            file_ext = original_filename.split(".")[-1]
            filename = f"{uuid.uuid4()}.{file_ext}"
            dest_path = os.path.join(user_dir, filename)

            # Copy file
            shutil.copy2(file_path, dest_path)

            logger.info(f"Uploaded file locally: {dest_path}")
            return dest_path

        except Exception as e:
            logger.error(f"Error uploading file locally: {e}")
            raise ValueError(f"Failed to upload file: {str(e)}")

    def delete_file(self, file_path: str) -> bool:
        """Delete local file."""
        import os

        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                logger.info(f"Deleted local file: {file_path}")
            return True
        except Exception as e:
            logger.error(f"Error deleting local file: {e}")
            return False


# Factory to get appropriate handler based on environment
def get_file_handler():
    """Get file handler based on environment."""
    if settings.ENVIRONMENT == "development":
        return LocalFileHandler()
    else:
        return S3FileHandler()
