from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import uuid
import logging
import models, schemas
from database import get_db

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/forms",
    tags=["forms"],
)

@router.post("", response_model=schemas.Form)
def create_form(form: schemas.FormCreate, db: Session = Depends(get_db)):
    try:
        logger.info(f"Received FormCreate request: {form}")
        logger.info(f"Creating form: title={form.title}")
        db_form = models.Form(**form.model_dump())
        db.add(db_form)
        db.commit()
        db.refresh(db_form)
        db_form.response_count = 0
        logger.info(f"Form created successfully: id={db_form.id}")
        return db_form
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating form: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to create form: {str(e)}")


@router.get("", response_model=List[schemas.Form])
def read_forms(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    try:
        forms = db.query(models.Form).offset(skip).limit(limit).all()
        for form in forms:
            form.response_count = db.query(models.Response).filter(models.Response.form_id == form.id).count()
        return forms
    except Exception as e:
        logger.error(f"Error reading forms: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to read forms: {str(e)}")

@router.get("/{form_id}", response_model=schemas.Form)
def read_form(form_id: int, db: Session = Depends(get_db)):
    try:
        form = db.query(models.Form).filter(models.Form.id == form_id).first()
        if form is None:
            raise HTTPException(status_code=404, detail="Form not found")
        form.response_count = db.query(models.Response).filter(models.Response.form_id == form.id).count()
        return form
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error reading form {form_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to read form: {str(e)}")

@router.get("/{form_id}/responses")
def get_form_responses(form_id: int, db: Session = Depends(get_db)):
    try:
        # Simple endpoint to fetch all responses for a form
        # Including related answers
        responses = db.query(models.Response).filter(models.Response.form_id == form_id).all()
        
        result = []
        for resp in responses:
            answers = db.query(models.Answer).filter(models.Answer.response_id == resp.id).all()
            result.append({
                "id": resp.id,
                "submitted_at": resp.submitted_at,
                "answers": [{"question_id": a.question_id, "value": a.value} for a in answers]
            })
        return result
    except Exception as e:
        logger.error(f"Error fetching responses for form {form_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch responses: {str(e)}")

@router.patch("/{form_id}", response_model=schemas.Form)
def update_form(form_id: int, form_update: schemas.FormUpdate, db: Session = Depends(get_db)):
    try:
        db_form = db.query(models.Form).filter(models.Form.id == form_id).first()
        if not db_form:
            raise HTTPException(status_code=404, detail="Form not found")
        
        update_data = form_update.model_dump(exclude_unset=True)
        
        # Handle is_published alias
        if "is_published" in update_data:
            is_pub = update_data.pop("is_published")
            update_data["status"] = "published" if is_pub else "draft"
        
        for key, value in update_data.items():
            setattr(db_form, key, value)
            
        db.commit()
        db.refresh(db_form)
        db_form.response_count = db.query(models.Response).filter(models.Response.form_id == db_form.id).count()
        return db_form
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating form {form_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to update form: {str(e)}")


@router.post("/{form_id}/duplicate", response_model=schemas.Form)
def duplicate_form(form_id: int, db: Session = Depends(get_db)):
    try:
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
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error duplicating form {form_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to duplicate form: {str(e)}")

@router.delete("/{form_id}")
def delete_form(form_id: int, db: Session = Depends(get_db)):
    try:
        form = db.query(models.Form).filter(models.Form.id == form_id).first()
        if form is None:
            raise HTTPException(status_code=404, detail="Form not found")
        db.delete(form)
        db.commit()
        return {"message": "Form deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting form {form_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to delete form: {str(e)}")

@router.post("/{form_id}/publish", response_model=schemas.Form)
def publish_form(form_id: int, db: Session = Depends(get_db)):
    try:
        db_form = db.query(models.Form).filter(models.Form.id == form_id).first()
        if not db_form:
            raise HTTPException(status_code=404, detail="Form not found")
        db_form.status = schemas.FormStatus.published
        db.commit()
        db.refresh(db_form)
        return db_form
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error publishing form {form_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to publish form: {str(e)}")

@router.post("/{form_id}/unpublish", response_model=schemas.Form)
def unpublish_form(form_id: int, db: Session = Depends(get_db)):
    try:
        db_form = db.query(models.Form).filter(models.Form.id == form_id).first()
        if not db_form:
            raise HTTPException(status_code=404, detail="Form not found")
        db_form.status = schemas.FormStatus.draft
        db.commit()
        db.refresh(db_form)
        return db_form
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error unpublishing form {form_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to unpublish form: {str(e)}")

# Public endpoint for respondents
@router.get("/public/{share_token}", response_model=schemas.Form)
def get_public_form(share_token: str, db: Session = Depends(get_db)):
    try:
        form = db.query(models.Form).filter(models.Form.share_token == share_token, models.Form.status == "published").first()
        if not form:
            raise HTTPException(status_code=404, detail="Form not found or not published")
        form.response_count = db.query(models.Response).filter(models.Response.form_id == form.id).count()
        return form
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching public form {share_token}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch form: {str(e)}")

# Responses nested under public form
@router.post("/public/{share_token}/responses", response_model=schemas.Response)
def submit_public_response(share_token: str, response: schemas.ResponseCreate, db: Session = Depends(get_db)):
    try:
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
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error submitting response for form {share_token}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to submit response: {str(e)}")
