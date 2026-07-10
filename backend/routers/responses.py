from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas
from ..database import get_db

router = APIRouter(
    prefix="/responses",
    tags=["responses"],
)

@router.post("/", response_model=schemas.Response)
def submit_response(response: schemas.ResponseCreate, form_id: int, db: Session = Depends(get_db)):
    db_response = models.Response(form_id=form_id)
    db.add(db_response)
    db.commit()
    db.refresh(db_response)
    
    for ans in response.answers:
        db_answer = models.Answer(response_id=db_response.id, question_id=ans.question_id, value=ans.value)
        db.add(db_answer)
    db.commit()
    db.refresh(db_response)
    return db_response

@router.get("/form/{form_id}", response_model=List[schemas.Response])
def get_form_responses(form_id: int, db: Session = Depends(get_db)):
    return db.query(models.Response).filter(models.Response.form_id == form_id).all()
