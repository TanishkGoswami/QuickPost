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

// ── Fire-and-forget sync to getaipilot.in hub ──────────────────────────────
// Called after every successful sign-in on social.getaipilot.in.
// Ensures the user exists in hub's auth.users + profiles tables.
async function syncUserToHub(sessionUser) {
  const hubSyncUrl   = import.meta.env.VITE_HUB_SYNC_FUNCTION_URL;
  const syncSecret   = import.meta.env.VITE_SOCIAL_SYNC_SECRET;
  // Supabase gateway requires Authorization: Bearer <anon_key>
  // otherwise returns 401 before the function even runs
  const hubAnonKey   = import.meta.env.VITE_HUB_SUPABASE_ANON_KEY;

  if (!hubSyncUrl || !syncSecret || !hubAnonKey) {
    console.warn("[HUB-SYNC] Missing env vars, skipping sync");
    return;
  }

  try {
    const payload = {
      email:           sessionUser.email,
      name:            sessionUser.user_metadata?.full_name || sessionUser.email?.split("@")[0],
      google_id:       sessionUser.identities?.find(i => i.provider === "google")?.identity_data?.sub || undefined,
      profile_picture: sessionUser.user_metadata?.avatar_url || sessionUser.user_metadata?.picture || undefined,
      social_user_id:  sessionUser.id,
    };

    const res = await fetch(hubSyncUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${hubAnonKey}`,  // required by Supabase gateway
        "x-sync-secret": syncSecret,               // our own auth layer
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      console.log("✅ [HUB-SYNC] User synced to hub:", data.hub_user_id);
    } else {
      console.warn("⚠️ [HUB-SYNC] Sync returned", res.status, data);
    }
  } catch (err) {
    console.warn("⚠️ [HUB-SYNC] Sync failed (non-fatal):", err.message);
  }
}


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
      // Step 1: Check local users table
      const { data: localUser } = await supabase
        .from('users')
        .select('plan, subscription_status')
        .eq('id', sessionUser.id)
        .maybeSingle();

      let resolvedPlan   = localUser?.plan || 'Free';
      let resolvedStatus = localUser?.subscription_status || 'active';

      // Step 2: Check hub_subscriptions by EMAIL
      // This table is populated by bulk-sync-to-social and sync-from-hub.
      // If user purchased on getaipilot.in, their plan is stored here.
      const { data: hubSub } = await supabase
        .from('hub_subscriptions')
        .select('plan, plan_id, subscription_status')
        .eq('email', sessionUser.email)
        .maybeSingle();

      if (hubSub && hubSub.plan && hubSub.plan !== 'Free') {
        resolvedPlan   = hubSub.plan;   // Enterprise / Pro
        resolvedStatus = hubSub.subscription_status || 'active';
        console.log('✅ [HUB-SUB] Plan from hub_subscriptions:', resolvedPlan, '(', hubSub.plan_id, ')');

        // Write back to local users table so future lookups are instant
        await supabase
          .from('users')
          .update({ plan: resolvedPlan, subscription_status: resolvedStatus })
          .eq('id', sessionUser.id);
      }

      setUser(prev => prev ? {
        ...prev,
        plan: resolvedPlan,
        subscription_status: resolvedStatus,
      } : null);

    } catch (error) {
      console.error("Error fetching user profile:", error);
      setUser(prev => prev ? {
        ...prev,
        plan: 'Free',
        subscription_status: 'active',
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
          picture: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
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
          picture: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
        };
        setUser(userData);
        localStorage.setItem("quickpost_token", session.access_token);
        fetchConnectedAccounts();
        fetchUserProfile(session.user);

        // Sync to hub — only on SIGNED_IN event to avoid spamming on every token refresh
        if (_event === "SIGNED_IN" || _event === "USER_UPDATED") {
          syncUserToHub(session.user);
        }
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
        redirectTo: window.location.origin + "/login",
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
