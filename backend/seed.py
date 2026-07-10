from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
import models
import uuid
import json

# Ensure tables exist
Base.metadata.create_all(bind=engine)

def seed():
    db: Session = SessionLocal()

    # Clear existing data for a clean slate
    db.query(models.Answer).delete()
    db.query(models.Response).delete()
    db.query(models.Question).delete()
    db.query(models.Form).delete()
    db.commit()

    # Create a Form
    form = models.Form(
        title="Customer Feedback Survey",
        share_token=str(uuid.uuid4()),
        status="published"
    )
    db.add(form)
    db.commit()
    db.refresh(form)

    # Create Questions
    q1 = models.Question(
        form_id=form.id,
        type="short_text",
        title="What is your full name?",
        is_required=True,
        order_index=0
    )
    q2 = models.Question(
        form_id=form.id,
        type="multiple_choice",
        title="How did you hear about us?",
        is_required=True,
        order_index=1,
        settings={"options": ["Google", "Social Media", "Friend", "Other"]}
    )
    q3 = models.Question(
        form_id=form.id,
        type="rating",
        title="How would you rate your experience?",
        is_required=True,
        order_index=2,
    )
    db.add_all([q1, q2, q3])
    db.commit()
    db.refresh(q1)
    db.refresh(q2)
    db.refresh(q3)

    # Create Sample Responses
    for i in range(1, 4):
        resp = models.Response(form_id=form.id)
        db.add(resp)
        db.commit()
        db.refresh(resp)

        a1 = models.Answer(response_id=resp.id, question_id=q1.id, value=f"Test User {i}")
        a2 = models.Answer(response_id=resp.id, question_id=q2.id, value="Google")
        a3 = models.Answer(response_id=resp.id, question_id=q3.id, value="5")
        
        db.add_all([a1, a2, a3])
        db.commit()

    print(f"Database seeded successfully!")
    print(f"Form ID: {form.id}")
    print(f"Share Token: {form.share_token}")
    print(f"Builder URL: http://localhost:3000/builder/{form.id}")
    print(f"Respondent URL: http://localhost:3000/form/{form.share_token}")
    print(f"Results URL: http://localhost:3000/results/{form.id}")

    db.close()

if __name__ == "__main__":
    seed()
