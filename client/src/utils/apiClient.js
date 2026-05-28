import axios from 'axios';
import { supabase } from '../lib/supabase';

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

// Request interceptor to add auth token dynamically from Supabase session
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (isUsableAuthToken(token)) {
        config.headers.Authorization = `Bearer ${token}`;
        // Sync back to localStorage for any remaining legacy flows
        localStorage.setItem('quickpost_token', token);
      } else {
        // Fallback to localStorage if session is not loaded yet or if we have an older flow
        const localToken = localStorage.getItem('quickpost_token');
        if (isUsableAuthToken(localToken)) {
          config.headers.Authorization = `Bearer ${localToken}`;
        } else {
          // Token is completely missing.
          // For protected routes, if we are not on a public page, redirect to login
          const isPublicPage = window.location.pathname === '/login' || 
                               window.location.pathname === '/register' || 
                               window.location.pathname === '/' ||
                               window.location.pathname.startsWith('/auth/callback');
          
          if (!isPublicPage) {
            console.warn('[apiClient] No session token found. Redirecting to /login.');
            localStorage.removeItem('quickpost_token');
            // Safely redirect to login to avoid loops
            window.location.href = '/login';
          }
          
          delete config.headers.Authorization;
        }
      }
    } catch (err) {
      console.error('[apiClient] Error getting supabase session:', err);
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
      console.warn('[apiClient] 401 Unauthorized:', error.config?.url);
      
      const isPublicPage = window.location.pathname === '/login' || 
                           window.location.pathname === '/register' || 
                           window.location.pathname === '/' ||
                           window.location.pathname.startsWith('/auth/callback');
      
      if (!isPublicPage) {
        console.warn('[apiClient] 401 received on protected route. Redirecting to /login.');
        localStorage.removeItem('quickpost_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
