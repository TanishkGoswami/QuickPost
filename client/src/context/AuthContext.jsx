import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import apiClient from '../utils/apiClient';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [connectedAccounts, setConnectedAccounts] = useState({
    instagram: false,
    youtube: false,
    pinterest: false,
    facebook: false,
    bluesky: false,
    linkedin: false,
    mastodon: false,
    threads: false,
    x: false,
    reddit: false
  });
  const [loading, setLoading] = useState(true);

  const fetchConnectedAccounts = useCallback(async () => {
    try {
      const response = await apiClient.get('/api/auth/accounts');
      if (response.data.success) {
        const accounts = response.data.accounts;
        const transformedAccounts = {
          instagram: accounts.instagram?.connected || false,
          youtube: accounts.youtube?.connected || false,
          pinterest: accounts.pinterest?.connected || false,
          facebook: accounts.facebook?.connected || false,
          bluesky: accounts.bluesky?.connected || false,
          linkedin: accounts.linkedin?.connected || false,
          mastodon: accounts.mastodon?.connected || false,
          threads: accounts.threads?.connected || false,
          x: accounts.x?.connected || false,
          reddit: accounts.reddit?.connected || false,
        };
        setConnectedAccounts(transformedAccounts);
      }
    } catch (error) {
      console.error('Error fetching connected accounts:', error);
    }
  }, []);

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        setUser({
          userId: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0]
        });
        localStorage.setItem('quickpost_token', session.access_token);
        fetchConnectedAccounts();
      }
      setLoading(false);
    });

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        setUser({
          userId: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0]
        });
        localStorage.setItem('quickpost_token', session.access_token);
        fetchConnectedAccounts();
      } else {
        setUser(null);
        localStorage.removeItem('quickpost_token');
        setConnectedAccounts({ 
          instagram: false, youtube: false, pinterest: false, facebook: false, 
          bluesky: false, linkedin: false, mastodon: false, threads: false, x: false, reddit: false
        });
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchConnectedAccounts]);

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  const signUp = async (email, password, name) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    });
    if (error) throw error;
    return data;
  };

  const googleSignIn = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) throw error;
    return data;
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const refreshAccounts = useCallback(async () => {
    await fetchConnectedAccounts();
  }, [fetchConnectedAccounts]);

  const value = useMemo(() => ({
    user,
    session,
    connectedAccounts,
    loading,
    login,
    signUp,
    googleSignIn,
    logout,
    refreshAccounts,
    isAuthenticated: !!user
  }), [user, session, connectedAccounts, loading, refreshAccounts]);

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
