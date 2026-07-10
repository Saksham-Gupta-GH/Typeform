from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import models
from database import engine
import os

# Create the database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Typeform Clone API")

# Configure CORS
origins = [
    "http://localhost:3000",
    "http://20.219.130.205",
    "http://20.219.130.205:3000",
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

from routers import forms, questions, responses

app.include_router(forms.router)
app.include_router(questions.router)
app.include_router(responses.router)

@app.get("/")
def read_root():
    return {"message": "Typeform Clone API is running"}
