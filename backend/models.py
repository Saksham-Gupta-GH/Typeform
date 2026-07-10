from sqlalchemy import Boolean, Column, Integer, String, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from database import Base

def generate_share_token():
    return str(uuid.uuid4())

class Form(Base):
    __tablename__ = "forms"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    status = Column(String, default="draft") # draft or published
    share_token = Column(String, unique=True, index=True, default=generate_share_token)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    questions = relationship("Question", back_populates="form", cascade="all, delete-orphan", order_by="Question.order_index")
    responses = relationship("Response", back_populates="form", cascade="all, delete-orphan")

class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    form_id = Column(Integer, ForeignKey("forms.id"))
    type = Column(String) # short_text, long_text, multiple_choice, dropdown, email, number, yes_no, rating
    title = Column(String)
    description = Column(String, nullable=True)
    is_required = Column(Boolean, default=False)
    order_index = Column(Integer)
    settings = Column(JSON, nullable=True)

    form = relationship("Form", back_populates="questions")
    answers = relationship("Answer", back_populates="question", cascade="all, delete-orphan")

class Response(Base):
    __tablename__ = "responses"

    id = Column(Integer, primary_key=True, index=True)
    form_id = Column(Integer, ForeignKey("forms.id"))
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())

    form = relationship("Form", back_populates="responses")
    answers = relationship("Answer", back_populates="response", cascade="all, delete-orphan")

class Answer(Base):
    __tablename__ = "answers"

    id = Column(Integer, primary_key=True, index=True)
    response_id = Column(Integer, ForeignKey("responses.id"))
    question_id = Column(Integer, ForeignKey("questions.id"))
    value = Column(JSON)

    response = relationship("Response", back_populates="answers")
    question = relationship("Question", back_populates="answers")
