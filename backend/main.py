from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
import models
from database import engine
import os
import sqlite3
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create the database tables
models.Base.metadata.create_all(bind=engine)

# Run migration to add missing columns
try:
    import migrate_db
    migrate_db.migrate()
except Exception as e:
    logger.warning(f"Migration warning: {e}")

# Disable redirect_slashes to prevent 307 redirects
app = FastAPI(title="Typeform Clone API", redirect_slashes=False)

logger.info("FastAPI app initialized")

# Custom exception handler for validation errors
@app.exception_handler(RequestValidationError)
def validation_exception_handler(request, exc):
    errors = exc.errors()
    logger.error(f"Validation error on {request.url.path}: {errors}")
    
    # Build user-friendly error message
    error_details = []
    for error in errors:
        field = '.'.join(str(x) for x in error.get('loc', []))
        msg = error.get('msg', 'validation failed')
        error_details.append(f"{field}: {msg}")
    
    error_msg = "; ".join(error_details) if error_details else "Invalid request"
    
    return JSONResponse(
        status_code=422,
        content={
            "detail": error_msg,
            "errors": errors
        },
    )

# Configure CORS
origins = [
    "http://localhost:3000",
    "http://localhost",
    "http://20.219.130.205",
    "http://20.219.130.205:3000",
    "https://typeform-ivory.vercel.app",
    "https://*.vercel.app",
]

# Allow overriding via environment variable
env_origins = os.getenv("ALLOWED_ORIGINS")
if env_origins:
    origins.extend(env_origins.split(","))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from routers import forms, questions, responses, auth

app.include_router(forms.router)
app.include_router(questions.router)
app.include_router(responses.router)
app.include_router(auth.router)

@app.get("/")
def read_root():
    logger.info("Root endpoint called")
    return {
        "message": "Typeform Clone API is running",
        "status": "healthy",
        "version": "1.0.0"
    }

@app.get("/health")
def health_check():
    logger.info("Health check endpoint called")
    return {"status": "healthy"}
