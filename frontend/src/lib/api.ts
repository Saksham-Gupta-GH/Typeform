const API_BASE_URL = '/api';

export interface QuestionSettings {
  options?: string[];
  min?: number;
  max?: number;
}

export interface Question {
  id: number;
  form_id: number;
  type: string;
  title: string;
  description?: string;
  is_required: boolean;
  order_index: number;
  settings?: QuestionSettings;
}

export interface FormSubmission {
  id: number;
  submitted_at: string;
  answers: { question_id: number; value: string | number | boolean }[];
}

export async function fetchQuestions(formId: string): Promise<Question[]> {
  const res = await fetch(`${API_BASE_URL}/questions/form/${formId}`);
  if (!res.ok) throw new Error('Failed to fetch questions');
  return res.json();
}

export async function createQuestion(formId: string, questionData: Partial<Question>): Promise<Question> {
  const res = await fetch(`${API_BASE_URL}/questions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...questionData, form_id: parseInt(formId) }),
  });
  if (!res.ok) throw new Error('Failed to create question');
  return res.json();
}

export async function updateQuestion(questionId: number, questionData: Partial<Question>): Promise<Question> {
  const res = await fetch(`${API_BASE_URL}/questions/${questionId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(questionData),
  });
  if (!res.ok) throw new Error('Failed to update question');
  return res.json();
}

export async function deleteQuestion(questionId: number): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE_URL}/questions/${questionId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete question');
  return res.json();
}

export async function reorderQuestions(questionIds: number[]): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE_URL}/questions/reorder`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question_ids: questionIds }),
  });
  if (!res.ok) throw new Error('Failed to reorder questions');
  return res.json();
}

export async function submitResponse(shareToken: string, answers: { question_id: number, value: string | number | boolean }[]) {
  const res = await fetch(`${API_BASE_URL}/forms/public/${shareToken}/responses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers }),
  });
  if (!res.ok) throw new Error('Failed to submit response');
  return res.json();
}

export async function fetchPublicForm(shareToken: string) {
  const res = await fetch(`${API_BASE_URL}/forms/public/${shareToken}`);
  if (!res.ok) throw new Error('Failed to fetch public form');
  return res.json();
}

export async function fetchResponses(formId: string) {
  const res = await fetch(`${API_BASE_URL}/forms/${formId}/responses`);
  if (!res.ok) throw new Error('Failed to fetch responses');
  return res.json();
}
