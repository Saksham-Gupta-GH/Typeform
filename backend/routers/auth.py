from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
import secrets
import logging
import os
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from jose import jwt

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/auth",
    tags=["auth"],
)

SECRET_KEY = os.getenv("JWT_SECRET", "super_secret_key_change_me_in_prod")
ALGORITHM = "HS256"
# By default, use a placeholder. The user should provide this in .env
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "placeholder_client_id")

class SignInRequest(BaseModel):
    name: str
    email: EmailStr

class GoogleSignInRequest(BaseModel):
    credential: str

class SignInResponse(BaseModel):
    token: str
    name: str
    email: str

class SignOutRequest(BaseModel):
    token: str

class UserInfo(BaseModel):
    name: str
    email: str

@router.post("/google", response_model=SignInResponse)
def google_sign_in(request: GoogleSignInRequest):
    """Sign in securely with Google OAuth credential"""
    try:
        # In production, this validates the JWT signature securely via Google's public keys.
        idinfo = id_token.verify_oauth2_token(request.credential, google_requests.Request(), GOOGLE_CLIENT_ID)
        
        email = idinfo.get('email')
        name = idinfo.get('name', email.split('@')[0])
        
        if not email:
            raise ValueError("Token missing email")

        # Generate secure JWT session token
        token = jwt.encode({"sub": email, "name": name}, SECRET_KEY, algorithm=ALGORITHM)
        
        logger.info(f"User signed in securely via Google: {email}")
        
        return SignInResponse(
            token=token,
            name=name,
            email=email
        )
    except ValueError as e:
        logger.error(f"Google Sign in error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=401, detail="Invalid Google token or Client ID mismatch")
    except Exception as e:
        logger.error(f"Google Sign in server error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Sign in failed")

@router.post("/signin", response_model=SignInResponse)
def sign_in(request: SignInRequest):
    """Legacy dummy sign in with name and email"""
    try:
        token = jwt.encode({"sub": request.email, "name": request.name}, SECRET_KEY, algorithm=ALGORITHM)
        logger.info(f"User signed in (legacy): {request.email}")
        
        return SignInResponse(
            token=token,
            name=request.name,
            email=request.email
        )
    except Exception as e:
        logger.error(f"Sign in error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Sign in failed")

@router.post("/signout")
def sign_out(request: SignOutRequest):
    """Sign out is handled mostly client side by clearing token."""
    logger.info("User signed out")
    return {"message": "Signed out successfully"}

@router.get("/verify")
def verify_token(token: str):
    """Verify if JWT token is valid and return user info"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        name = payload.get("name", "")
        
        if not email:
            raise HTTPException(status_code=401, detail="Invalid token payload")
            
        return UserInfo(name=name, email=email)
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    except Exception as e:
        logger.error(f"Token verification error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=401, detail="Token verification failed")
