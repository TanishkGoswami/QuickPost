import { supabase } from "@/lib/supabase";
import apiClient from "@/utils/apiClient";

export const autodmSupabase = supabase;

export function isAutoDMConfigured() {
  return true;
}

export async function refreshAutoDMBridgeToken() {
  return null;
}

export async function startAutoDMInstagramOAuth(frontendUrl: string, forceReconnect = true) {
  const body = { frontendUrl, forceReconnect };
  try {
    const response = await apiClient.post("/api/autodm/oauth-start", body);

    if (!response.data?.success || !response.data?.redirectTo) {
      throw new Error(response.data?.error || "AutoDM OAuth URL not returned by server");
    }

    return response.data.redirectTo;
  } catch (error: any) {
    if (!error.response) {
      const { data, error: edgeError } = await supabase.functions.invoke("oauth-start", { body });

      if (edgeError) {
        throw new Error(edgeError.message || "Failed to start Auto DM Instagram login");
      }

      if (!data?.redirectTo || typeof data.redirectTo !== "string") {
        throw new Error(data?.error || "AutoDM OAuth URL not returned by Supabase");
      }

      return data.redirectTo;
    }

    throw new Error(
      error.response?.data?.error ||
        error.message ||
        "Failed to start Auto DM Instagram login"
    );
  }
}
