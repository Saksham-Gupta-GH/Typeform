from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import uuid
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
    for form in forms:
        form.response_count = db.query(models.Response).filter(models.Response.form_id == form.id).count()
    return forms

@router.get("/{form_id}", response_model=schemas.Form)
def read_form(form_id: int, db: Session = Depends(get_db)):
    form = db.query(models.Form).filter(models.Form.id == form_id).first()
    if form is None:
        raise HTTPException(status_code=404, detail="Form not found")
    form.response_count = db.query(models.Response).filter(models.Response.form_id == form.id).count()
    return form

@router.patch("/{form_id}", response_model=schemas.Form)
def update_form(form_id: int, form_update: schemas.FormUpdate, db: Session = Depends(get_db)):
    db_form = db.query(models.Form).filter(models.Form.id == form_id).first()
    if not db_form:
        raise HTTPException(status_code=404, detail="Form not found")
    
    update_data = form_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_form, key, value)
        
    db.commit()
    db.refresh(db_form)
    return db_form

@router.post("/{form_id}/duplicate", response_model=schemas.Form)
def duplicate_form(form_id: int, db: Session = Depends(get_db)):
    db_form = db.query(models.Form).filter(models.Form.id == form_id).first()
    if not db_form:
        raise HTTPException(status_code=404, detail="Form not found")
        
    new_form = models.Form(
        title=f"{db_form.title} (Copy)",
        status="draft",
        share_token=str(uuid.uuid4())
    )
    db.add(new_form)
    db.commit()
    db.refresh(new_form)
    
    for q in db_form.questions:
        new_q = models.Question(
            form_id=new_form.id,
            type=q.type,
            title=q.title,
            description=q.description,
            is_required=q.is_required,
            order_index=q.order_index,
            settings=q.settings
        )
        db.add(new_q)
        
    db.commit()
    db.refresh(new_form)
    return new_form

@router.delete("/{form_id}")
def delete_form(form_id: int, db: Session = Depends(get_db)):
    form = db.query(models.Form).filter(models.Form.id == form_id).first()
    if form is None:
        raise HTTPException(status_code=404, detail="Form not found")
    db.delete(form)
    db.commit()
    return {"message": "Form deleted successfully"}

# Public endpoint for respondents
@router.get("/public/{share_token}", response_model=schemas.Form)
def get_public_form(share_token: str, db: Session = Depends(get_db)):
    form = db.query(models.Form).filter(models.Form.share_token == share_token, models.Form.status == "published").first()
    if not form:
        raise HTTPException(status_code=404, detail="Form not found or not published")
    return form

# Responses nested under public form
@router.post("/public/{share_token}/responses", response_model=schemas.Response)
def submit_public_response(share_token: str, response: schemas.ResponseCreate, db: Session = Depends(get_db)):
    form = db.query(models.Form).filter(models.Form.share_token == share_token, models.Form.status == "published").first()
    if not form:
        raise HTTPException(status_code=404, detail="Form not found or not published")
        
    db_response = models.Response(form_id=form.id)
    db.add(db_response)
    db.commit()
    db.refresh(db_response)
    
    for ans in response.answers:
        db_answer = models.Answer(response_id=db_response.id, question_id=ans.question_id, value=ans.value)
        db.add(db_answer)
        
    db.commit()
    db.refresh(db_response)
    return db_response
