const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function fetchQuestions(formId: string) {
  const res = await fetch(`${API_BASE_URL}/questions/form/${formId}`);
  if (!res.ok) throw new Error('Failed to fetch questions');
  return res.json();
}

export async function createQuestion(formId: string, questionData: any) {
  const res = await fetch(`${API_BASE_URL}/questions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...questionData, form_id: parseInt(formId) }),
  });
  if (!res.ok) throw new Error('Failed to create question');
  return res.json();
}

export async function updateQuestion(questionId: number, questionData: any) {
  const res = await fetch(`${API_BASE_URL}/questions/${questionId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(questionData),
  });
  if (!res.ok) throw new Error('Failed to update question');
  return res.json();
}

export async function deleteQuestion(questionId: number) {
  const res = await fetch(`${API_BASE_URL}/questions/${questionId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete question');
  return res.json();
}
