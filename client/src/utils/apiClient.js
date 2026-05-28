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
  async (error) => {
    if (error.response?.status === 401) {
      console.warn('[apiClient] 401 Unauthorized received:', error.config?.url);
      
      const isPublicPage = window.location.pathname === '/login' || 
                           window.location.pathname === '/register' || 
                           window.location.pathname === '/' ||
                           window.location.pathname.startsWith('/auth/callback');
      
      if (!isPublicPage) {
        console.warn('[apiClient] 401 received on protected route. Logging out...');
        // Clear local storage token
        localStorage.removeItem('quickpost_token');
        // Sign out from Supabase safely to let the React router handle redirect cleanly
        await supabase.auth.signOut().catch((err) => {
          console.warn('[apiClient] Supabase signOut failed:', err);
        });
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
