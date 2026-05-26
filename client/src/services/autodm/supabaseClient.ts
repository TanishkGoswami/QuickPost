import { createClient } from "@supabase/supabase-js";
import apiClient from "@/utils/apiClient";

const autodmUrl = import.meta.env.VITE_AUTODM_SUPABASE_URL;
const autodmAnonKey = import.meta.env.VITE_AUTODM_SUPABASE_ANON_KEY;
const hasAutoDMConfig = Boolean(autodmUrl && autodmAnonKey);

if (!hasAutoDMConfig) {
  console.warn("[AutoDM] Missing VITE_AUTODM_SUPABASE_URL or VITE_AUTODM_SUPABASE_ANON_KEY");
}

let bridgeTokenPromise = null;
let bridgeTokenCache = null;

async function fetchBridgeToken(forceRefresh = false) {
  const now = Math.floor(Date.now() / 1000);
  if (!forceRefresh && bridgeTokenCache?.token && bridgeTokenCache.expiresAt > now + 30) {
    return bridgeTokenCache.token;
  }

  if (!forceRefresh && bridgeTokenPromise) {
    return bridgeTokenPromise;
  }

  bridgeTokenPromise = apiClient.get("/api/autodm/bridge-token").then((response) => {
    if (!response.data?.success || !response.data?.token) {
      throw new Error(response.data?.error || "Failed to fetch AutoDM bridge token");
    }

    bridgeTokenCache = {
      token: response.data.token,
      expiresAt: response.data.expiresAt,
    };
    return response.data.token;
  }).finally(() => {
    bridgeTokenPromise = null;
  });

  return bridgeTokenPromise;
}

const createUnavailableClient = () =>
  new Proxy(
    {},
    {
      get() {
        throw new Error(
          "Auto DM is not configured. Add VITE_AUTODM_SUPABASE_URL and VITE_AUTODM_SUPABASE_ANON_KEY to the Social Pilot client env."
        );
      },
    }
  );

export const autodmSupabase = hasAutoDMConfig
  ? createClient(autodmUrl, autodmAnonKey, {
      accessToken: async () => fetchBridgeToken(),
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    })
  : createUnavailableClient();

export function isAutoDMConfigured() {
  return hasAutoDMConfig;
}

export async function refreshAutoDMBridgeToken() {
  bridgeTokenCache = null;
  return fetchBridgeToken(true);
}

export async function startAutoDMInstagramOAuth(frontendUrl) {
  if (!hasAutoDMConfig) {
    throw new Error(
      "Auto DM is not configured. Add VITE_AUTODM_SUPABASE_URL and VITE_AUTODM_SUPABASE_ANON_KEY to the Social Pilot client env."
    );
  }

  try {
    const response = await apiClient.post("/api/autodm/oauth-start", {
      frontendUrl,
    });

    if (!response.data?.success || !response.data?.redirectTo) {
      throw new Error(response.data?.error || "AutoDM OAuth URL not returned by server");
    }

    return response.data.redirectTo;
  } catch (error) {
    throw new Error(
      error.response?.data?.error ||
        error.message ||
        "Failed to start Auto DM Instagram login"
    );
  }
}
