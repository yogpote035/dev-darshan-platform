import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Authentication is carried by the HttpOnly auth cookie.
API.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle account blocks or session expiries
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      const isAuthRoute = error.config?.url?.includes('/auth/profile');

      // If unauthorized (unverified/expired token) or blocked
      if (status === 401 || status === 403) {
        if (isAuthRoute || data.message?.includes('blocked')) {
          localStorage.removeItem('live_darshan_user');
          window.dispatchEvent(new Event('auth_logout'));
        }
      }
    }
    return Promise.reject(error);
  }
);

export default API;
