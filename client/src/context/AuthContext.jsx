import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import apiClient from "../utils/apiClient";
import { supabase } from "../lib/supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [connectedAccounts, setConnectedAccounts] = useState({
    instagram: { connected: false },
    youtube: { connected: false },
    pinterest: { connected: false },
    facebook: { connected: false },
    bluesky: { connected: false },
    linkedin: { connected: false },
    mastodon: { connected: false },
    threads: { connected: false },
    x: { connected: false },
    reddit: { connected: false },
    googleBusiness: { connected: false },
  });
  const [loading, setLoading] = useState(true);

  const fetchConnectedAccounts = useCallback(async () => {
    try {
      console.log("🔄 Fetching connected accounts...");
      const response = await apiClient.get("/api/auth/accounts");
      if (response.data.success) {
        const accounts = response.data.accounts;
        console.log("✅ Accounts fetched successfully:", Object.keys(accounts).filter(k => accounts[k].connected));
        console.log("📊 Full accounts data:", accounts);
        setConnectedAccounts(accounts);
      } else {
        console.error("❌ Failed to fetch accounts:", response.data.error);
      }
    } catch (error) {
      console.error("💥 Error fetching connected accounts:", error.message || error);
    }
  }, []);

  const fetchUserProfile = useCallback(async (sessionUser) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('plan, subscription_status')
        .eq('id', sessionUser.id)
        .maybeSingle();
      
      setUser(prev => prev ? { 
        ...prev, 
        plan: data?.plan || sessionUser.user_metadata?.plan || 'Free', 
        subscription_status: data?.subscription_status || sessionUser.user_metadata?.subscription_status || 'active' 
      } : null);
      
    } catch (error) {
      console.error("Error fetching user profile:", error);
      // Fallback to user_metadata
      setUser(prev => prev ? { 
        ...prev, 
        plan: sessionUser.user_metadata?.plan || 'Free', 
        subscription_status: sessionUser.user_metadata?.subscription_status || 'active' 
      } : null);
    }
  }, []);

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        const userData = {
          userId: session.user.id,
          email: session.user.email,
          name:
            session.user.user_metadata?.full_name ||
            session.user.email?.split("@")[0],
          plan: session.user.user_metadata?.plan || 'Free',
          subscription_status: session.user.user_metadata?.subscription_status || 'active',
        };
        setUser(userData);
        localStorage.setItem("quickpost_token", session.access_token);
        fetchConnectedAccounts();
        fetchUserProfile(session.user);
      }
      setLoading(false);
    });

    // Listen for changes on auth state (logged in, signed out, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        const userData = {
          userId: session.user.id,
          email: session.user.email,
          name:
            session.user.user_metadata?.full_name ||
            session.user.email?.split("@")[0],
          plan: session.user.user_metadata?.plan || 'Free',
          subscription_status: session.user.user_metadata?.subscription_status || 'active',
        };
        setUser(userData);
        localStorage.setItem("quickpost_token", session.access_token);
        fetchConnectedAccounts();
        fetchUserProfile(session.user);
      } else {
        setUser(null);
        localStorage.removeItem("quickpost_token");
        setConnectedAccounts({
          instagram: { connected: false },
          youtube: { connected: false },
          pinterest: { connected: false },
          facebook: { connected: false },
          bluesky: { connected: false },
          linkedin: { connected: false },
          mastodon: { connected: false },
          threads: { connected: false },
          x: { connected: false },
          reddit: { connected: false },
          googleBusiness: { connected: false },
        });
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchConnectedAccounts, fetchUserProfile]);

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
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
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

  const value = useMemo(
    () => ({
      user,
      session,
      connectedAccounts,
      loading,
      login,
      signUp,
      googleSignIn,
      logout,
      refreshAccounts,
      isAuthenticated: !!user,
    }),
    [user, session, connectedAccounts, loading, refreshAccounts],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
