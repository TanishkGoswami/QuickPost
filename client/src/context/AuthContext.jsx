import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import apiClient from "../utils/apiClient";
import { supabase } from "../lib/supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const autoYouTubeAttemptRef = useRef(null);
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
    reddit: false,
  });
  const [loading, setLoading] = useState(true);

  const fetchConnectedAccounts = useCallback(async () => {
    try {
      const response = await apiClient.get("/api/auth/accounts");
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
      console.error("Error fetching connected accounts:", error);
    }
  }, []);

  const autoConnectYouTubeForGoogleSession = useCallback(
    async (activeSession) => {
      const providerToken = activeSession?.provider_token;
      if (!providerToken) return;

      const provider = activeSession?.user?.app_metadata?.provider;
      const providers = activeSession?.user?.app_metadata?.providers || [];
      const identityProviders = (activeSession?.user?.identities || []).map(
        (identity) => identity.provider,
      );
      const isGoogleSession =
        provider === "google" ||
        providers.includes("google") ||
        identityProviders.includes("google");

      if (!isGoogleSession) return;

      const attemptKey = `${activeSession.user.id}:${providerToken.slice(0, 20)}`;
      if (autoYouTubeAttemptRef.current === attemptKey) return;
      autoYouTubeAttemptRef.current = attemptKey;

      try {
        await apiClient.post("/api/auth/youtube/auto-connect", {
          providerAccessToken: providerToken,
          providerRefreshToken: activeSession?.provider_refresh_token || null,
        });
        await fetchConnectedAccounts();
      } catch (error) {
        console.warn(
          "Auto YouTube connect skipped:",
          error?.response?.data?.error || error.message,
        );
      }
    },
    [fetchConnectedAccounts],
  );

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        setUser({
          userId: session.user.id,
          email: session.user.email,
          name:
            session.user.user_metadata?.full_name ||
            session.user.email?.split("@")[0],
        });
        localStorage.setItem("quickpost_token", session.access_token);
        fetchConnectedAccounts();
        autoConnectYouTubeForGoogleSession(session);
      }
      setLoading(false);
    });

    // Listen for changes on auth state (logged in, signed out, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (session) {
        setUser({
          userId: session.user.id,
          email: session.user.email,
          name:
            session.user.user_metadata?.full_name ||
            session.user.email?.split("@")[0],
        });
        localStorage.setItem("quickpost_token", session.access_token);
        fetchConnectedAccounts();
        if (event === "SIGNED_IN") {
          autoConnectYouTubeForGoogleSession(session);
        }
      } else {
        setUser(null);
        localStorage.removeItem("quickpost_token");
        autoYouTubeAttemptRef.current = null;
        setConnectedAccounts({
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
          reddit: false,
        });
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [autoConnectYouTubeForGoogleSession, fetchConnectedAccounts]);

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
        scopes:
          "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly email profile",
        queryParams: {
          access_type: "offline",
          prompt: "consent",
          include_granted_scopes: "true",
        },
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
