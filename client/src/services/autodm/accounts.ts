import apiClient from "@/utils/apiClient";
import { autodmSupabase } from "./supabaseClient";

export async function getAutoDMStatus() {
  const response = await apiClient.get("/api/autodm/status");
  if (!response.data?.success) {
    throw new Error(response.data?.error || "Failed to load AutoDM status");
  }
  return response.data;
}

export async function importInstagramAccountFromSocial() {
  const response = await apiClient.post("/api/autodm/import-instagram");
  if (!response.data?.success) {
    throw new Error(response.data?.error || "Failed to import Instagram account");
  }
  return response.data.account;
}

export async function listInstagramAccountsForUser(userId) {
  const { data, error } = await autodmSupabase
    .from("instagram_accounts")
    .select("*")
    .eq("user_id", userId)
    .eq("is_connected", true)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function disconnectInstagramAccount(accountId, userId) {
  const { error } = await autodmSupabase
    .from("instagram_accounts")
    .update({ is_connected: false })
    .eq("id", accountId)
    .eq("user_id", userId);

  if (error) throw error;
}
