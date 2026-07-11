from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
import secrets
import logging

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/auth",
    tags=["auth"],
)

# In-memory store for demo (in production, use database)
sessions: dict[str, dict] = {}

class SignInRequest(BaseModel):
    name: str
    email: EmailStr

class SignInResponse(BaseModel):
    token: str
    name: str
    email: str

class SignOutRequest(BaseModel):
    token: str

class UserInfo(BaseModel):
    name: str
    email: str

@router.post("/signin", response_model=SignInResponse)
def sign_in(request: SignInRequest):
    """Sign in with name and email"""
    try:
        # Generate a unique session token
        token = secrets.token_urlsafe(32)
        
        # Store session
        sessions[token] = {
            "name": request.name,
            "email": request.email
        }
        
        logger.info(f"User signed in: {request.email}")
        
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
    """Sign out by invalidating token"""
    try:
        if request.token in sessions:
            del sessions[request.token]
            logger.info("User signed out")
        return {"message": "Signed out successfully"}
    except Exception as e:
        logger.error(f"Sign out error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Sign out failed")

@router.get("/verify")
def verify_token(token: str):
    """Verify if token is valid and return user info"""
    try:
        if token not in sessions:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        
        user_info = sessions[token]
        return UserInfo(name=user_info["name"], email=user_info["email"])
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Token verification error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=401, detail="Token verification failed")
