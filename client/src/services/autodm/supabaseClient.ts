import { supabase } from "@/lib/supabase";
import apiClient from "@/utils/apiClient";

export const autodmSupabase = supabase;

export function isAutoDMConfigured() {
  return true;
}

export async function refreshAutoDMBridgeToken() {
  return null;
}

export async function startAutoDMInstagramOAuth(frontendUrl: string) {
  try {
    const response = await apiClient.post("/api/autodm/oauth-start", {
      frontendUrl,
    });

    if (!response.data?.success || !response.data?.redirectTo) {
      throw new Error(response.data?.error || "AutoDM OAuth URL not returned by server");
    }

    return response.data.redirectTo;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.error ||
        error.message ||
        "Failed to start Auto DM Instagram login"
    );
  }
}
