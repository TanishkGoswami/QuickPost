import axios from 'axios';

// In dev, use empty base URL so requests go through Vite's proxy (avoids ngrok CORS/interstitial).
// In production, use the full API URL from the env.
const API_BASE_URL = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || '');

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
});

const isUsableAuthToken = (token) => {
  if (!token) return false;
  const trimmed = token.trim();
  return trimmed !== 'null' && trimmed !== 'undefined' && trimmed.split('.').length === 3;
};

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('quickpost_token');
    if (isUsableAuthToken(token)) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      delete config.headers.Authorization;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — just log it.
      // Do NOT force window.location redirect here: that wipes React state
      // and causes an infinite login/dashboard redirect loop.
      // Components that need to handle 401 (e.g. logout) should do so explicitly.
      console.warn('[apiClient] 401 Unauthorized:', error.config?.url);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
