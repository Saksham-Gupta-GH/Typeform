from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas
from ..database import get_db

router = APIRouter(
    prefix="/responses",
    tags=["responses"],
)

# NOTE: Public submission route moved to forms.py as /forms/public/{share_token}/responses

@router.get("/form/{form_id}", response_model=List[schemas.Response])
def get_form_responses(form_id: int, db: Session = Depends(get_db)):
    # This is intended for the creator dashboard to view all results
    return db.query(models.Response).filter(models.Response.form_id == form_id).all()

@router.get("/{response_id}", response_model=schemas.Response)
def get_single_response(response_id: int, db: Session = Depends(get_db)):
    response = db.query(models.Response).filter(models.Response.id == response_id).first()
    if not response:
         raise HTTPException(status_code=404, detail="Response not found")
    return response
