import re

with open('frontend/src/lib/api.ts', 'r') as f:
    content = f.read()

# Add getAuthHeaders
auth_func = """
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
"""

content = content.replace("export async function fetchForms(): Promise<Form[]> {", auth_func + "\nexport async function fetchForms(): Promise<Form[]> {")

content = content.replace("headers: { 'Content-Type': 'application/json' }", "headers: getAuthHeaders()")
content = content.replace("fetch(`${API_BASE_URL}/forms`)", "fetch(`${API_BASE_URL}/forms`, { headers: getAuthHeaders(false) })")
content = content.replace("fetch(`${API_BASE_URL}/forms/${formId}/questions`)", "fetch(`${API_BASE_URL}/forms/${formId}/questions`, { headers: getAuthHeaders(false) })")
content = content.replace("fetch(`${API_BASE_URL}/forms/${formId}/responses`)", "fetch(`${API_BASE_URL}/forms/${formId}/responses`, { headers: getAuthHeaders(false) })")

with open('frontend/src/lib/api.ts', 'w') as f:
    f.write(content)
