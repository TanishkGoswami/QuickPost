import { autodmSupabase } from "./supabaseClient";

export async function listOrders(userId) {
  const { data, error } = await autodmSupabase
    .from("orders")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    if (error.code === "PGRST205" || String(error.message || "").toLowerCase().includes("orders")) {
      return { unavailable: true, data: [] };
    }
    throw error;
  }

  return { unavailable: false, data: data || [] };
}
