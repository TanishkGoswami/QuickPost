import { autodmSupabase } from "./supabaseClient";

export async function listProducts(userId) {
  const { data, error } = await autodmSupabase
    .from("products")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createProduct(payload) {
  const { data, error } = await autodmSupabase.from("products").insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function updateProduct(id, userId, payload) {
  const { data, error } = await autodmSupabase
    .from("products")
    .update(payload)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteProduct(id, userId) {
  const { error } = await autodmSupabase.from("products").delete().eq("id", id).eq("user_id", userId);
  if (error) throw error;
}
