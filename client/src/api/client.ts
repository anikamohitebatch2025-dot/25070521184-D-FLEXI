import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
});

// Interceptor to attach token from localStorage if present (for seamless client fallback)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('flexi_token');
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for centralized error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check if unauthorized and session expired
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      // Allow auth context to handle logout
    }
    return Promise.reject(error);
  }
);

export default api;
