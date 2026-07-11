from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
import models
import uuid
import json

# Ensure tables exist (drop first to apply any schema changes like user_id)
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

def seed():
    db: Session = SessionLocal()

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

    # Create Form 2: Event Registration
    form2 = models.Form(
        title="Event Registration",
        share_token=str(uuid.uuid4()),
        status="published"
    )
    db.add(form2)
    db.commit()
    db.refresh(form2)

    # Create Questions for Form 2
    f2_q1 = models.Question(
        form_id=form2.id,
        type="email",
        title="What is your email address?",
        is_required=True,
        order_index=0
    )
    f2_q2 = models.Question(
        form_id=form2.id,
        type="number",
        title="How many guests are you bringing?",
        is_required=True,
        order_index=1,
        settings={"min": 0, "max": 5}
    )
    f2_q3 = models.Question(
        form_id=form2.id,
        type="yes_no",
        title="Will you require parking?",
        is_required=False,
        order_index=2
    )
    f2_q4 = models.Question(
        form_id=form2.id,
        type="dropdown",
        title="Select your dietary preference",
        is_required=True,
        order_index=3,
        settings={"options": ["None", "Vegetarian", "Vegan", "Gluten-Free"]}
    )
    f2_q5 = models.Question(
        form_id=form2.id,
        type="long_text",
        title="Any special requests or comments?",
        is_required=False,
        order_index=4
    )
    
    db.add_all([f2_q1, f2_q2, f2_q3, f2_q4, f2_q5])
    db.commit()
    db.refresh(f2_q1)
    db.refresh(f2_q2)
    db.refresh(f2_q3)
    db.refresh(f2_q4)
    db.refresh(f2_q5)

    # Sample responses for Form 2
    for i in range(1, 3):
        resp = models.Response(form_id=form2.id)
        db.add(resp)
        db.commit()
        db.refresh(resp)

        a1 = models.Answer(response_id=resp.id, question_id=f2_q1.id, value=f"guest{i}@example.com")
        a2 = models.Answer(response_id=resp.id, question_id=f2_q2.id, value=str(i))
        a3 = models.Answer(response_id=resp.id, question_id=f2_q3.id, value="Yes" if i % 2 == 0 else "No")
        a4 = models.Answer(response_id=resp.id, question_id=f2_q4.id, value="Vegetarian")
        a5 = models.Answer(response_id=resp.id, question_id=f2_q5.id, value="Looking forward to it!")
        
        db.add_all([a1, a2, a3, a4, a5])
        db.commit()

    print(f"Database seeded successfully!")
    print(f"--- Form 1: {form.title} ---")
    print(f"Form ID: {form.id}")
    print(f"Share Token: {form.share_token}")
    print(f"Builder URL: http://localhost:3000/builder/{form.id}")
    print(f"Respondent URL: http://localhost:3000/form/{form.share_token}")
    print(f"Results URL: http://localhost:3000/results/{form.id}\n")

    print(f"--- Form 2: {form2.title} ---")
    print(f"Form ID: {form2.id}")
    print(f"Share Token: {form2.share_token}")
    print(f"Builder URL: http://localhost:3000/builder/{form2.id}")
    print(f"Respondent URL: http://localhost:3000/form/{form2.share_token}")
    print(f"Results URL: http://localhost:3000/results/{form2.id}")

    db.close()

if __name__ == "__main__":
    seed()
