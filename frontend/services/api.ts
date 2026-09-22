const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const getApiUrl = (path: string) => `${API_URL}/api/v1${path}`;

export const fetchWithAuth = async (path: string, options: RequestInit = {}) => {
  const token = typeof window !== 'undefined' ? (sessionStorage.getItem('token') || localStorage.getItem('token')) : null;
  
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(getApiUrl(path), {
    ...options,
    headers,
  });

  if (response.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      // Only redirect if not already on login page to avoid loops
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
          window.location.href = '/login';
      }
    }
  }

  return response;
};
