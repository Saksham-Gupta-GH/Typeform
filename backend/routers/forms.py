from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas
from ..database import get_db

router = APIRouter(
    prefix="/forms",
    tags=["forms"],
)

@router.post("/", response_model=schemas.Form)
def create_form(form: schemas.FormCreate, db: Session = Depends(get_db)):
    db_form = models.Form(**form.model_dump())
    db.add(db_form)
    db.commit()
    db.refresh(db_form)
    return db_form

@router.get("/", response_model=List[schemas.Form])
def read_forms(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    forms = db.query(models.Form).offset(skip).limit(limit).all()
    # Compute response counts dynamically if needed, or query them efficiently
    for form in forms:
        form.response_count = db.query(models.Response).filter(models.Response.form_id == form.id).count()
    return forms

@router.get("/{form_id}", response_model=schemas.Form)
def read_form(form_id: int, db: Session = Depends(get_db)):
    form = db.query(models.Form).filter(models.Form.id == form_id).first()
    if form is None:
        raise HTTPException(status_code=404, detail="Form not found")
    return form

@router.delete("/{form_id}")
def delete_form(form_id: int, db: Session = Depends(get_db)):
    form = db.query(models.Form).filter(models.Form.id == form_id).first()
    if form is None:
        raise HTTPException(status_code=404, detail="Form not found")
    db.delete(form)
    db.commit()
    return {"message": "Form deleted successfully"}
