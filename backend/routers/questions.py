from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas
from ..database import get_db

router = APIRouter(
    prefix="/questions",
    tags=["questions"],
)

@router.get("/form/{form_id}", response_model=List[schemas.Question])
def get_form_questions(form_id: int, db: Session = Depends(get_db)):
    questions = db.query(models.Question).filter(models.Question.form_id == form_id).order_by(models.Question.order_index).all()
    return questions

@router.post("/", response_model=schemas.Question)
def create_question(question: schemas.QuestionCreate, db: Session = Depends(get_db)):
    db_question = models.Question(**question.model_dump())
    db.add(db_question)
    db.commit()
    db.refresh(db_question)
    return db_question

@router.patch("/{question_id}", response_model=schemas.Question)
def update_question(question_id: int, question_update: schemas.QuestionUpdate, db: Session = Depends(get_db)):
    db_question = db.query(models.Question).filter(models.Question.id == question_id).first()
    if not db_question:
        raise HTTPException(status_code=404, detail="Question not found")
        
    update_data = question_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_question, key, value)
        
    db.commit()
    db.refresh(db_question)
    return db_question

@router.post("/reorder")
def reorder_questions(ordered_ids: List[int], db: Session = Depends(get_db)):
    # Simple batch update for ordering
    for index, q_id in enumerate(ordered_ids):
        db.query(models.Question).filter(models.Question.id == q_id).update({"order_index": index})
    db.commit()
    return {"message": "Reordered successfully"}

@router.delete("/{question_id}")
def delete_question(question_id: int, db: Session = Depends(get_db)):
    question = db.query(models.Question).filter(models.Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    db.delete(question)
    db.commit()
    return {"message": "Question deleted"}
