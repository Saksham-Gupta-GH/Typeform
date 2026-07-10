from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class QuestionType(str, Enum):
    short_text = "short_text"
    long_text = "long_text"
    multiple_choice = "multiple_choice"
    dropdown = "dropdown"
    email = "email"
    number = "number"
    yes_no = "yes_no"
    rating = "rating"

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
    type: QuestionType
    title: str
    description: Optional[str] = None
    is_required: bool = False
    order_index: int
    settings: Optional[Dict[str, Any]] = None

class QuestionCreate(QuestionBase):
    pass

class QuestionUpdate(BaseModel):
    type: Optional[QuestionType] = None
    title: Optional[str] = None
    description: Optional[str] = None
    is_required: Optional[bool] = None
    order_index: Optional[int] = None
    settings: Optional[Dict[str, Any]] = None

class Question(QuestionBase):
    id: int
    form_id: int

    class Config:
        from_attributes = True

class FormStatus(str, Enum):
    draft = "draft"
    published = "published"

# --- Form Schemas ---
class FormBase(BaseModel):
    title: str
    status: FormStatus = FormStatus.draft

class FormCreate(FormBase):
    pass

class FormUpdate(BaseModel):
    title: Optional[str] = None
    status: Optional[str] = None

class Form(FormBase):
    id: int
    share_token: str
    created_at: datetime
    updated_at: datetime
    questions: List[Question] = []
    response_count: int = 0

    class Config:
        from_attributes = True
