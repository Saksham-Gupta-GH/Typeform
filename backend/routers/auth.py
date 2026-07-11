from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
import logging
import os
from jose import jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from database import get_db
import models

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/auth",
    tags=["auth"],
)

SECRET_KEY = os.getenv("JWT_SECRET", "super_secret_key_change_me_in_prod")
ALGORITHM = "HS256"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class SignUpRequest(BaseModel):
    name: str
    email: EmailStr
    password: str

class SignInRequest(BaseModel):
    email: EmailStr
    password: str

class SignInResponse(BaseModel):
    token: str
    name: str
    email: str

class UserInfo(BaseModel):
    name: str
    email: str

@router.post("/signup", response_model=SignInResponse)
def sign_up(request: SignUpRequest, db: Session = Depends(get_db)):
    try:
        # Check if user exists
        existing_user = db.query(models.User).filter(models.User.email == request.email).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")

        hashed_password = pwd_context.hash(request.password)
        new_user = models.User(name=request.name, email=request.email, hashed_password=hashed_password)
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        token = jwt.encode({"sub": request.email, "name": request.name}, SECRET_KEY, algorithm=ALGORITHM)
        logger.info(f"User signed up: {request.email}")
        return SignInResponse(token=token, name=request.name, email=request.email)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Sign up error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Sign up failed")

@router.post("/signin", response_model=SignInResponse)
def sign_in(request: SignInRequest, db: Session = Depends(get_db)):
    try:
        user = db.query(models.User).filter(models.User.email == request.email).first()
        if not user or not pwd_context.verify(request.password, user.hashed_password):
            raise HTTPException(status_code=401, detail="Invalid email or password")
            
        token = jwt.encode({"sub": user.email, "name": user.name}, SECRET_KEY, algorithm=ALGORITHM)
        logger.info(f"User signed in: {user.email}")
        return SignInResponse(token=token, name=user.name, email=user.email)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Sign in error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Sign in failed")

@router.post("/signout")
def sign_out():
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

from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer(auto_error=False)

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    if not credentials:
        return None
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if email is None:
            return None
        user = db.query(models.User).filter(models.User.email == email).first()
        return user
    except Exception:
        return None
