import React, { createContext, useState, useContext, useEffect } from 'react';
import apiClient from '../utils/apiClient';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [connectedAccounts, setConnectedAccounts] = useState({
    instagram: false,
    youtube: false,
    pinterest: false,
    facebook: false,
    bluesky: false,
    linkedin: false,
    mastodon: false,
    tiktok: false,
    threads: false,
    x: false,
    reddit: false
  });
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('quickpost_token'));

  // Load user data from token
  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Decode token to get user info
        const decoded = jwtDecode(token);
        
        // Check if token is expired
        const currentTime = Date.now() / 1000;
        if (decoded.exp < currentTime) {
          // Token expired, logout
          logout();
          return;
        }

        setUser({
          userId: decoded.userId,
          email: decoded.email,
          name: decoded.name
        });

        // Fetch connected accounts
        await fetchConnectedAccounts();
      } catch (error) {
        console.error('Error loading user:', error);
        logout();
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [token]);

  const fetchConnectedAccounts = async () => {
    try {
      const response = await apiClient.get('/api/auth/accounts');
      if (response.data.success) {
        // Transform the accounts object to extract just the connected boolean
        const accounts = response.data.accounts;
        const transformedAccounts = {
          instagram: accounts.instagram?.connected || false,
          youtube: accounts.youtube?.connected || false,
          pinterest: accounts.pinterest?.connected || false,
          facebook: accounts.facebook?.connected || false,
          bluesky: accounts.bluesky?.connected || false,
          linkedin: accounts.linkedin?.connected || false,
          mastodon: accounts.mastodon?.connected || false,
          tiktok: accounts.tiktok?.connected || false,
          threads: accounts.threads?.connected || false,
          x: accounts.x?.connected || false,
          reddit: accounts.reddit?.connected || false,
        };
        setConnectedAccounts(transformedAccounts);
      }
    } catch (error) {
      console.error('Error fetching connected accounts:', error);
    }
  };

  const login = (jwtToken) => {
    localStorage.setItem('quickpost_token', jwtToken);
    setToken(jwtToken);
  };

  const logout = () => {
    localStorage.removeItem('quickpost_token');
    setToken(null);
    setUser(null);
    setConnectedAccounts({ 
      instagram: false, youtube: false, pinterest: false, facebook: false, 
      bluesky: false, linkedin: false, mastodon: false, tiktok: false, threads: false, x: false, reddit: false
    });
  };

  const refreshAccounts = async () => {
    await fetchConnectedAccounts();
  };

  const value = {
    user,
    connectedAccounts,
    loading,
    login,
    logout,
    refreshAccounts,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
