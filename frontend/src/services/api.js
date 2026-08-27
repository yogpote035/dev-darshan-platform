import axios from 'axios';

// Hostinger serves the compiled React files without injecting Vite variables.
// Keep the public production API endpoint explicit in the client bundle.
const apiBaseUrl = 'https://api.devdarshanlive.com/api';

const API = axios.create({
  baseURL: apiBaseUrl.replace(/\/$/, ''),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('live_darshan_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
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
          localStorage.removeItem('live_darshan_token');
          window.dispatchEvent(new Event('auth_logout'));
        }
      }
    }
    return Promise.reject(error);
  }
);

export default API;
