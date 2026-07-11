from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import models, schemas
from database import get_db
import logging

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/questions",
    tags=["questions"],
)

@router.get("/form/{form_id}", response_model=List[schemas.Question])
def get_form_questions(form_id: int, db: Session = Depends(get_db)):
    try:
        questions = db.query(models.Question).filter(models.Question.form_id == form_id).order_by(models.Question.order_index).all()
        return questions
    except Exception as e:
        logger.error(f"Error fetching questions: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch questions: {str(e)}")

@router.post("", response_model=schemas.Question)
def create_question(question: schemas.QuestionCreate, db: Session = Depends(get_db)):
    try:
        logger.info(f"Creating question: form_id={question.form_id}, type={question.type}, title={question.title}")
        db_question = models.Question(**question.model_dump())
        db.add(db_question)
        db.commit()
        db.refresh(db_question)
        logger.info(f"Question created successfully: id={db_question.id}")
        return db_question
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating question: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to create question: {str(e)}")

@router.patch("/{question_id}", response_model=schemas.Question)
def update_question(question_id: int, question_update: schemas.QuestionUpdate, db: Session = Depends(get_db)):
    try:
        db_question = db.query(models.Question).filter(models.Question.id == question_id).first()
        if not db_question:
            raise HTTPException(status_code=404, detail="Question not found")
            
        update_data = question_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_question, key, value)
            
        db.commit()
        db.refresh(db_question)
        return db_question
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating question {question_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to update question: {str(e)}")

from pydantic import BaseModel

class ReorderRequest(BaseModel):
    question_ids: List[int]

@router.post("/reorder")
def reorder_questions(payload: ReorderRequest, db: Session = Depends(get_db)):
    try:
        # Simple batch update for ordering
        for index, q_id in enumerate(payload.question_ids):
            db.query(models.Question).filter(models.Question.id == q_id).update({"order_index": index})
        db.commit()
        return {"message": "Reordered successfully"}
    except Exception as e:
        db.rollback()
        logger.error(f"Error reordering questions: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to reorder questions: {str(e)}")

@router.delete("/{question_id}")
def delete_question(question_id: int, db: Session = Depends(get_db)):
    try:
        question = db.query(models.Question).filter(models.Question.id == question_id).first()
        if not question:
            raise HTTPException(status_code=404, detail="Question not found")
        db.delete(question)
        db.commit()
        return {"message": "Question deleted"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting question {question_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to delete question: {str(e)}")
