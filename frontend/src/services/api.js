import axios from 'axios';

// Hostinger serves the compiled React files without injecting Vite variables.
// Production stays hard-coded; local development uses the local backend.
const isLocalHost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
const apiBaseUrl = isLocalHost ? 'http://localhost:5001/api' : 'https://api.devdarshanlive.com/api';

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
      const url = error.config?.url || '';
      const isPublicAuthRequest = [
        '/auth/login',
        '/auth/register',
        '/auth/forgot-password',
        '/auth/reset-password'
      ].some((path) => url.includes(path));

      // A protected request returning 401/403 means the local token is expired,
      // invalid, or the account was blocked. Clear it so every page agrees on
      // the signed-out state instead of leaving a stale premium/user interface.
      if ((status === 401 || status === 403) && !isPublicAuthRequest && localStorage.getItem('live_darshan_token')) {
        localStorage.removeItem('live_darshan_user');
        localStorage.removeItem('live_darshan_token');
        window.dispatchEvent(new Event('auth_logout'));
      }
    }
    return Promise.reject(error);
  }
);

export default API;
