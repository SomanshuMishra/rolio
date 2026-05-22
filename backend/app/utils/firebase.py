"""Firebase authentication utilities for Google Sign-In"""
import json
import firebase_admin
from firebase_admin import auth, credentials
from ..config import settings

firebase_app = None


def init_firebase():
    """Initialize Firebase Admin SDK with service account credentials"""
    global firebase_app

    if firebase_app is not None:
        return firebase_app

    try:
        # Try to load credentials from the environment variable (JSON string)
        if settings.FIREBASE_SERVICE_ACCOUNT_KEY:
            if isinstance(settings.FIREBASE_SERVICE_ACCOUNT_KEY, str):
                creds_dict = json.loads(settings.FIREBASE_SERVICE_ACCOUNT_KEY)
            else:
                creds_dict = settings.FIREBASE_SERVICE_ACCOUNT_KEY

            creds = credentials.Certificate(creds_dict)
            firebase_app = firebase_admin.initialize_app(creds, {
                'projectId': settings.FIREBASE_PROJECT_ID
            })
            return firebase_app
    except Exception as e:
        print(f"Warning: Firebase initialization failed: {e}")
        print("Google Sign-In will not be available. Set FIREBASE_SERVICE_ACCOUNT_KEY and FIREBASE_PROJECT_ID to enable.")
        return None


def verify_firebase_token(id_token: str) -> dict:
    """
    Verify a Firebase ID token and return the decoded payload

    Args:
        id_token: Firebase ID token from client

    Returns:
        dict: Decoded token payload with user info (uid, email, name, etc.)

    Raises:
        auth.InvalidIdTokenError: If token is invalid
        auth.ExpiredIdTokenError: If token is expired
    """
    try:
        # Initialize Firebase if not already done
        if firebase_app is None:
            init_firebase()

        # Verify the token using Firebase Admin SDK
        decoded_token = auth.verify_id_token(id_token)
        return decoded_token
    except auth.InvalidIdTokenError:
        raise Exception("Invalid ID token")
    except auth.ExpiredIdTokenError:
        raise Exception("ID token expired")
    except auth.RevokedIdTokenError:
        raise Exception("ID token revoked")
    except Exception as e:
        raise Exception(f"Failed to verify ID token: {str(e)}")


def get_or_create_user_from_firebase_token(decoded_token: dict, db_session):
    """
    Get or create a user from Firebase token payload

    Args:
        decoded_token: Decoded Firebase ID token
        db_session: SQLAlchemy database session

    Returns:
        User object from database
    """
    from ..models.user import User

    firebase_uid = decoded_token.get('uid')
    email = decoded_token.get('email')
    full_name = decoded_token.get('name', email.split('@')[0])  # Fallback to email prefix

    # Try to find user by firebase_uid first
    user = db_session.query(User).filter(User.firebase_uid == firebase_uid).first()

    if user:
        return user

    # Try to find by email
    user = db_session.query(User).filter(User.email == email).first()

    if user:
        # Link this firebase_uid to existing user
        user.firebase_uid = firebase_uid
        user.auth_provider = 'google'
        db_session.commit()
        return user

    # Create new user if it doesn't exist and auto-signup is enabled
    if settings.ALLOW_GOOGLE_AUTO_SIGNUP:
        user = User(
            email=email,
            full_name=full_name,
            firebase_uid=firebase_uid,
            auth_provider='google',
            hashed_password='',  # Google users don't have passwords
            is_onboarding_complete=False,
            is_active=True
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        return user

    raise Exception(f"User with email {email} not found and auto-signup is disabled")
