from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

# --- Answer Schemas ---
class AnswerBase(BaseModel):
    question_id: int
    value: Any

class AnswerCreate(AnswerBase):
    pass

class Answer(AnswerBase):
    id: int
    response_id: int

    class Config:
        from_attributes = True

# --- Response Schemas ---
class ResponseBase(BaseModel):
    pass

class ResponseCreate(ResponseBase):
    answers: List[AnswerCreate]

class Response(ResponseBase):
    id: int
    form_id: int
    submitted_at: datetime
    answers: List[Answer]

    class Config:
        from_attributes = True

# --- Question Schemas ---
class QuestionBase(BaseModel):
    type: str
    title: str
    description: Optional[str] = None
    is_required: bool = False
    order_index: int
    settings: Optional[Dict[str, Any]] = None

class QuestionCreate(QuestionBase):
    pass

class Question(QuestionBase):
    id: int
    form_id: int

    class Config:
        from_attributes = True

# --- Form Schemas ---
class FormBase(BaseModel):
    title: str
    status: str = "draft"

class FormCreate(FormBase):
    pass

class Form(FormBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    questions: List[Question] = []
    response_count: int = 0 # Computed property for ease

    class Config:
        from_attributes = True

class FormUpdate(BaseModel):
    title: Optional[str] = None
    status: Optional[str] = None
    questions: Optional[List[QuestionCreate]] = None
