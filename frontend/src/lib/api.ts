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

export interface Form {
  id: number;
  title: string;
  description?: string;
  share_token: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  design_settings?: {
    bgColor?: string;
    textColor?: string;
    buttonColor?: string;
    fontFamily?: string;
  };
}

export interface FormSubmission {
  id: number;
  submitted_at: string;
  answers: { question_id: number; value: string | number | boolean }[];
}


function getAuthHeaders(includeContentType = true): Record<string, string> {
  const headers: Record<string, string> = {};
  if (includeContentType) headers['Content-Type'] = 'application/json';
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('typeform_user_auth');
    if (saved) {
      try {
        const { token } = JSON.parse(saved);
        if (token) headers['Authorization'] = `Bearer ${token}`;
      } catch (e) {}
    }
  }
  return headers;
}

export async function fetchForms(): Promise<Form[]> {
  const res = await fetch(`${API_BASE_URL}/forms`, { headers: getAuthHeaders(false) });
  if (!res.ok) {
    console.error('Fetch forms error:', res.status);
    throw new Error(`Failed to fetch forms`);
  }
  return res.json();
}

export async function createForm(data: { title: string; description?: string }): Promise<Form> {
  const res = await fetch(`${API_BASE_URL}/forms`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    try {
      const errorData = await res.json();
      const errorMsg = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail || errorData);
      console.error('Create form error:', errorMsg);
      throw new Error(errorMsg);
    } catch (e) {
      console.error('Create form error:', res.status);
      throw new Error(`Failed to create form (HTTP ${res.status})`);
    }
  }
  return res.json();
}

export async function updateForm(formId: number, data: { title?: string; description?: string; is_published?: boolean; design_settings?: any }): Promise<Form> {
  const res = await fetch(`${API_BASE_URL}/forms/${formId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const errorMsg = errorData.detail || `HTTP ${res.status}`;
    console.error('Update form error:', errorMsg, errorData);
    throw new Error(`Failed to update form: ${errorMsg}`);
  }
  return res.json();
}

export async function deleteForm(formId: number): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE_URL}/forms/${formId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const errorMsg = errorData.detail || `HTTP ${res.status}`;
    console.error('Delete form error:', errorMsg, errorData);
    throw new Error(`Failed to delete form: ${errorMsg}`);
  }
  return res.json();
}

export async function duplicateForm(formId: number): Promise<Form> {
  const res = await fetch(`${API_BASE_URL}/forms/${formId}/duplicate`, {
    method: 'POST',
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const errorMsg = errorData.detail || `HTTP ${res.status}`;
    console.error('Duplicate form error:', errorMsg, errorData);
    throw new Error(`Failed to duplicate form: ${errorMsg}`);
  }
  return res.json();
}

export async function fetchQuestions(formId: string): Promise<Question[]> {
  const res = await fetch(`${API_BASE_URL}/questions/form/${formId}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const errorMsg = errorData.detail || `HTTP ${res.status}`;
    console.error('Fetch questions error:', errorMsg, errorData);
    throw new Error(`Failed to fetch questions: ${errorMsg}`);
  }
  return res.json();
}

export async function createQuestion(formId: string, questionData: Partial<Question>): Promise<Question> {
  const payload = { ...questionData, form_id: parseInt(formId) };
  console.log('[API] Creating question with payload:', JSON.stringify(payload));
  
  const res = await fetch(`${API_BASE_URL}/questions`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  
  if (!res.ok) {
    try {
      const errorData = await res.json();
      console.log('[API] Error response:', errorData);
      const errorMsg = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail || errorData);
      console.error('Create question error:', errorMsg);
      throw new Error(errorMsg);
    } catch (e) {
      const text = await res.text().catch(() => res.statusText);
      console.error('Create question failed:', res.status, text);
      throw new Error(`Failed to create question (HTTP ${res.status})`);
    }
  }
  const result = await res.json();
  console.log('[API] Question created:', result.id);
  return result;
}

export async function updateQuestion(questionId: number, questionData: Partial<Question>): Promise<Question> {
  const res = await fetch(`${API_BASE_URL}/questions/${questionId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(questionData),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const errorMsg = errorData.detail || `HTTP ${res.status}`;
    console.error('Update question error:', errorMsg, errorData);
    throw new Error(`Failed to update question: ${errorMsg}`);
  }
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
    headers: getAuthHeaders(),
    body: JSON.stringify({ question_ids: questionIds }),
  });
  if (!res.ok) throw new Error('Failed to reorder questions');
  return res.json();
}

export async function submitResponse(shareToken: string, answers: { question_id: number, value: string | number | boolean }[]) {
  const res = await fetch(`${API_BASE_URL}/forms/public/${shareToken}/responses`, {
    method: 'POST',
    headers: getAuthHeaders(),
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
  const res = await fetch(`${API_BASE_URL}/forms/${formId}/responses`, { headers: getAuthHeaders(false) });
  if (!res.ok) throw new Error('Failed to fetch responses');
  return res.json();
}

// Auth functions
export async function signUp(name: string, email: string, password: string): Promise<{ token: string; name: string; email: string }> {
  const res = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ name, email, password }),
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const errorMsg = typeof errorData.detail === 'string' ? errorData.detail : 'Sign up failed';
    throw new Error(errorMsg);
  }
  
  return res.json();
}

export async function signIn(email: string, password: string): Promise<{ token: string; name: string; email: string }> {
  const res = await fetch(`${API_BASE_URL}/auth/signin`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ email, password }),
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const errorMsg = typeof errorData.detail === 'string' ? errorData.detail : 'Sign in failed';
    throw new Error(errorMsg);
  }
  
  return res.json();
}

export async function signOut(token: string): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE_URL}/auth/signout`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ token }),
  });
  
  if (!res.ok) throw new Error('Sign out failed');
  return res.json();
}

export async function verifyToken(token: string): Promise<{ name: string; email: string }> {
  const res = await fetch(`${API_BASE_URL}/auth/verify?token=${encodeURIComponent(token)}`);
  
  if (!res.ok) throw new Error('Token verification failed');
  return res.json();
}

// Design settings API
export async function saveFormDesign(formId: string, designSettings: Record<string, any>): Promise<Form> {
  const res = await fetch(`${API_BASE_URL}/forms/${formId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ design_settings: designSettings }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const errorMsg = typeof errorData.detail === 'string' ? errorData.detail : 'Failed to save design';
    throw new Error(errorMsg);
  }

  return res.json();
}
