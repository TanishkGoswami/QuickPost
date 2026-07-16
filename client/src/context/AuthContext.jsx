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

const FREE_ENTITLEMENTS = Object.freeze({
  plan: { id: 'free', name: 'Free' },
  subscription: { source: 'standalone', status: 'active' },
  features: { publishing: true, scheduling: true, analytics: true, autodm: true },
  limits: {
    social_accounts: 3,
    scheduled_queue: 10,
    team_members: 1,
    history_days: 7,
    autodm_accounts: 3,
    autodm_automations: 1,
    autodm_replies_per_month: 50,
    contacts: 100,
  },
  usage: {},
});

// ── Secure Server-Side Sync ──────────────────────────────────────────────────
// Disabling browser-side sync to prevent CORS errors and protect sensitive env vars
// (VITE_SOCIAL_SYNC_SECRET) from being exposed in production.
// The Express backend server already handles this securely on the server-to-server layer.
async function syncUserToHub(sessionUser) {
  console.info("[HUB-SYNC] Skipping browser-side hub sync (handled securely by backend)");
  return;
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
	    instagramAccounts: [],
	    youtubeAccounts: [],
	    pinterestAccounts: [],
	    facebookAccounts: [],
	    blueskyAccounts: [],
	    linkedinAccounts: [],
	    mastodonAccounts: [],
	    threadsAccounts: [],
	    xAccounts: [],
	    redditAccounts: [],
	    googleBusinessAccounts: [],
	  });
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);

  const fetchConnectedAccounts = useCallback(async () => {
    try {
      const response = await apiClient.get(`/api/auth/accounts?t=${Date.now()}`);
      if (response.data.success) {
        const accounts = response.data.accounts;
        setConnectedAccounts(accounts);
      }
    } catch (error) {
      console.error("💥 Error fetching connected accounts:", error.message || error);
    }
  }, []);

  const fetchUserProfile = useCallback(async (sessionUser) => {
    setProfileLoading(true);
    try {
      // Load standalone entitlements and legacy records in parallel. Standalone
      // entitlements are authoritative once a paid app subscription exists.
      const { data } = await apiClient.get('/api/billing/entitlements');
      const entitlements = data?.entitlements || FREE_ENTITLEMENTS;

      setUser(prev => prev ? {
        ...prev,
        plan: entitlements.plan.name,
        subscription_status: entitlements.subscription.status,
        entitlements,
      } : null);
    } catch (err) {
      console.error("Error fetching user profile:", err);
    } finally {
      setProfileLoading(false);
    }
  }, []);

      /*
       * Disabled legacy migration code retained temporarily for reference.
       * Hub product labels must never be used as QuickPost plan IDs.
       *
      // Priority: hub_subscriptions > local users table > auth user_metadata
      let resolvedPlan   = hasStandalonePaidPlan
        ? entitlements.plan.name
        : hubSub?.plan
        || localUser?.plan
        || sessionUser.user_metadata?.plan   // ← set by verify-subscription immediately after payment
        || 'Free';
      let resolvedStatus = hasStandalonePaidPlan
        ? entitlements.subscription.status
        : hubSub?.subscription_status
        || localUser?.subscription_status
        || sessionUser.user_metadata?.subscription_status
        || 'active';

      // Normalise — if somehow "Pro"/"Enterprise" slipped through from old code, map to new names
      if (!hasStandalonePaidPlan) {
        const p = resolvedPlan.toLowerCase();
        if (p.includes('monthly') || p.includes('core') || p === 'all_in_one_bundle_monthly') resolvedPlan = 'GAP Core';
        else if (p.includes('quarterly') || p.includes('pro') || p === 'all_in_one_bundle_quarterly') resolvedPlan = 'GAP Pro';
        else if (p.includes('half_yearly') || p.includes('max') || p === 'all_in_one_bundle_half_yearly') resolvedPlan = 'GAP Max';
        else if (p.includes('all_in_one') || p.includes('ultimate') || p.includes('enterprise')) resolvedPlan = 'GAP Ultimate Ecosystem';
        else if (p === 'pro') resolvedPlan = 'Social Pilot';
      }

      if (resolvedPlan !== 'Free') {
        console.log('✅ [AUTH] Plan resolved:', resolvedPlan);

        // Write back to hub_subscriptions if not already there
        if (!hubSub && sessionUser.email) {
          const { error: hubUpsertErr } = await supabase
            .from('hub_subscriptions')
            .upsert({ email: sessionUser.email, plan: resolvedPlan, subscription_status: resolvedStatus, updated_at: new Date().toISOString(), synced_at: new Date().toISOString() }, { onConflict: 'email' });
          if (hubUpsertErr) console.warn('[AUTH] hub_subscriptions upsert skipped (table may not exist in this project):', hubUpsertErr.message);
        }
      }

      setUser(prev => prev ? {
        ...prev,
        plan: resolvedPlan,
        subscription_status: resolvedStatus,
        entitlements,
      } : null);
      */

    } catch (error) {
      console.error("Error fetching user profile:", error);
      setUser(prev => prev ? {
        ...prev,
        plan: 'Free',
        subscription_status: 'active',
        entitlements: FREE_ENTITLEMENTS,
      } : null);
    }
  }, []);


  useEffect(() => {
    // ── Stale Session Prevention ─────────────────────────────────────────────
    // If the Supabase URL has changed (e.g. unified to a new instance), clear 
    // old local storage auth keys to prevent "Invalid Refresh Token" loops.
    const currentSupabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const storedSupabaseUrl = localStorage.getItem("last_supabase_url");
    
    if (storedSupabaseUrl && storedSupabaseUrl !== currentSupabaseUrl) {
      console.warn("🔄 [AUTH] Supabase URL changed. Clearing stale session tokens...");
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith("sb-") || key.includes("supabase") || key.includes("token")) {
          localStorage.removeItem(key);
        }
      });
      localStorage.setItem("last_supabase_url", currentSupabaseUrl);
      window.location.reload();
      return;
    } else if (!storedSupabaseUrl) {
      localStorage.setItem("last_supabase_url", currentSupabaseUrl);
    }

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
          plan: 'Free',
          subscription_status: 'active',
          entitlements: FREE_ENTITLEMENTS,
          picture: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
        };
        setUser(userData);
        localStorage.setItem("quickpost_token", session.access_token);
        fetchUserProfile(session.user);
      } else {
        localStorage.removeItem("quickpost_token");
        setProfileLoading(false);
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
          plan: 'Free',
          subscription_status: 'active',
          entitlements: FREE_ENTITLEMENTS,
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
        setProfileLoading(false);
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

  // Call this after payment to immediately reflect new plan in UI
  const refreshProfile = useCallback(async () => {
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (currentSession?.user) {
      // Force refresh the session to get latest user_metadata
      await supabase.auth.refreshSession();
      const { data: { session: freshSession } } = await supabase.auth.getSession();
      if (freshSession?.user) {
        await fetchUserProfile(freshSession.user);
      }
    }
  }, [fetchUserProfile]);

  const value = useMemo(
    () => ({
      user,
      session,
      connectedAccounts,
      loading,
      profileLoading,
      login,
      signUp,
      googleSignIn,
      logout,
      refreshAccounts,
      refreshProfile,
      isAuthenticated: !!user,
    }),
    [user, session, connectedAccounts, loading, profileLoading, refreshAccounts, refreshProfile],
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
