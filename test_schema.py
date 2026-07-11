from backend.schemas import QuestionCreate
import json

data = {"type": "short_text", "title": "Short Text question", "order_index": 0, "is_required": False, "form_id": 1}
try:
    q = QuestionCreate(**data)
    print("Success!", q)
except Exception as e:
    print("Error:", e)
