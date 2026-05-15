import { autodmSupabase } from "./supabaseClient";

export async function listContacts({ instagramAccountId, userId }) {
  let query = autodmSupabase
    .from("contacts")
    .select("*")
    .eq("user_id", userId)
    .order("last_interaction_at", { ascending: false });

  if (instagramAccountId) {
    query = query.eq("instagram_account_id", instagramAccountId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function listMessagesForContact(contactId, userId) {
  const { data, error } = await autodmSupabase
    .from("messages")
    .select("*")
    .eq("contact_id", contactId)
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data || [];
}
