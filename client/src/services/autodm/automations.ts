import { autodmSupabase } from "./supabaseClient";

export async function listAutomations({ instagramAccountId, userId }) {
  let query = autodmSupabase
    .from("automations")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (instagramAccountId) {
    query = query.eq("instagram_account_id", instagramAccountId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getAutomationById(id, userId) {
  const { data, error } = await autodmSupabase
    .from("automations")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createAutomation(payload) {
  const { data, error } = await autodmSupabase.from("automations").insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function updateAutomation(id, userId, payload) {
  const { data, error } = await autodmSupabase
    .from("automations")
    .update(payload)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteAutomation(id, userId) {
  const { error } = await autodmSupabase.from("automations").delete().eq("id", id).eq("user_id", userId);
  if (error) throw error;
}
