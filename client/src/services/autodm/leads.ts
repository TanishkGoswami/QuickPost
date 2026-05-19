import { autodmSupabase } from "./supabaseClient";

export async function listLeadsByAutomation({ automationId, userId, instagramAccountId }) {
  let query = autodmSupabase
    .from("leads")
    .select("*, contacts(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (automationId) {
    query = query.eq("automation_id", automationId);
  }

  if (instagramAccountId) {
    query = query.eq("instagram_account_id", instagramAccountId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}
