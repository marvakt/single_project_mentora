



export const AUTH_API = import.meta.env.VITE_AUTH_API || 'http://localhost:8000/api';
export const USER_API = import.meta.env.VITE_USER_API || 'http://localhost:8001/api';
export const MEDICAL_API = import.meta.env.VITE_MEDICAL_API || 'http://localhost:8003/api/v1';
export const APPOINTMENT_API = import.meta.env.VITE_APPOINTMENT_API || 'http://localhost:8002/api';

export const getAuthHeaders = () => {
  const token = sessionStorage.getItem('access_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

export const handleApiError = (error) => {
  console.error('API Error:', error);
  if (error.response?.status === 401) {
    sessionStorage.clear();
    window.location.href = '/login';
  }
  return error.response?.data?.detail || 'An error occurred';
};

export const apiCall = async (url, options = {}) => {
  // For Django REST endpoints that require trailing slashes, ensure proper formatting
  // Only add trailing slash if the URL follows REST API pattern and doesn't already have one
  let normalizedUrl = url;
  const [baseUrl, queryString] = url.split('?');

  // Apply trailing slash to base URL if needed
  // Skip for Medical Service (port 8003) which is FastAPI and prefers no trailing slash
  if (baseUrl.includes('/api/') && !baseUrl.endsWith('/') && !baseUrl.includes('.') && !baseUrl.includes(':8003')) {
    normalizedUrl = queryString ? `${baseUrl}/?${queryString}` : `${baseUrl}/`;
  }

  const token = sessionStorage.getItem('access_token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(normalizedUrl, { ...options, headers });
  return response;
};

export const medicalApiCall = async (endpoint, options = {}) => {
  const url = `${MEDICAL_API}${endpoint}`;
  return apiCall(url, options);
};