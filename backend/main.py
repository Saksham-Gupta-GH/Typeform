from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from . import models
from .database import engine

# Create the database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Typeform Clone API")

# Configure CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For development, allow all. Restrict in production.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from .routers import forms, questions, responses

app.include_router(forms.router)
app.include_router(questions.router)
app.include_router(responses.router)

@app.get("/")
def read_root():
    return {"message": "Typeform Clone API is running"}
