
// // API Configuration for VITE
// export const AUTH_API = import.meta.env.VITE_AUTH_API || 'http://localhost:8000/api';
// export const USER_API = import.meta.env.VITE_USER_API || 'http://localhost:8001/api';

// // Helper function to get auth headers
// export const getAuthHeaders = () => {
//   const token = sessionStorage.getItem('access_token');
//   return {
//     'Content-Type': 'application/json',
//     'Authorization': token ? `Bearer ${token}` : ''
//   };
// };

// // Helper function to handle API errors
// export const handleApiError = (error) => {
//   console.error('API Error:', error);
//   if (error.response?.status === 401) {
//     // Token expired, redirect to login
//     sessionStorage.clear();
//     window.location.href = '/login';
//   }
//   return error.response?.data?.detail || 'An error occurred';
// };

// ═══════════════════════════════════════════════════════════════
// FILE: src/config/api.js
// ═══════════════════════════════════════════════════════════════

// API Configuration for VITE
export const AUTH_API = import.meta.env.VITE_AUTH_API || 'http://localhost:8000/api';
export const USER_API = import.meta.env.VITE_USER_API || 'http://localhost:8001/api';

// Helper function to get auth headers
export const getAuthHeaders = () => {
  const token = sessionStorage.getItem('access_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

// Helper function to handle API errors
export const handleApiError = (error) => {
  console.error('API Error:', error);
  if (error.response?.status === 401) {
    // Token expired, redirect to login
    sessionStorage.clear();
    window.location.href = '/login';
  }
  return error.response?.data?.detail || 'An error occurred';
};