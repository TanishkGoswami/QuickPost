import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-sync-secret, Authorization",
};

function jsonRes(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

// Plans that include Social Pilot access
function isSocialPlan(planId: string): boolean {
  if (!planId) return false;
  const p = planId.toLowerCase();
  return p.startsWith("social_pilot") || p.startsWith("all_in_one");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS")
    return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== "POST")
    return jsonRes(405, { error: "Method not allowed" });

  // ── Auth ──────────────────────────────────────────────────────────────────
  const syncSecret = Deno.env.get("SOCIAL_SYNC_SECRET") ?? "";
  const incoming = req.headers.get("x-sync-secret") ?? "";

  if (!syncSecret || incoming !== syncSecret) {
    console.error("[sync-from-hub] Unauthorized");
    return jsonRes(401, { error: "Unauthorized" });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  if (!supabaseUrl || !supabaseKey) {
    return jsonRes(500, { error: "Server misconfiguration" });
  }

  try {
    const body = await req.json();
    const {
      email,
      name,
      hub_user_id,
      profile_picture,
      plan_id,
      plan,
      expires_at,
    } = body;

    if (!email) {
      return jsonRes(400, { error: "email is required" });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });

    const rawPlanId = plan_id || plan || "free";
    // Store exact plan_label from hub if this is a social-relevant plan
    // plan_label comes in as e.g. "Social Pilot" or "GAP Ultimate Ecosystem"
    const planLabel = body.plan_label || null;
    const hasSocial = isSocialPlan(rawPlanId);
    const storedPlan = hasSocial
      ? planLabel ||
        (rawPlanId.startsWith("all_in_one")
          ? "GAP Ultimate Ecosystem"
          : "Social Pilot")
      : "Free";

    // ── Upsert into hub_subscriptions (email as primary key) ──────────────
    // No auth user creation. No UUID conflicts. Simple and fast.
    const record: Record<string, unknown> = {
      email,
      plan: storedPlan,
      plan_id: rawPlanId,
      subscription_status: "active",
      updated_at: new Date().toISOString(),
      synced_at: new Date().toISOString(),
    };

    if (name) record.name = name;
    if (hub_user_id) record.hub_user_id = hub_user_id;
    if (profile_picture) record.profile_picture = profile_picture;
    if (expires_at) record.expires_at = expires_at;

    const { error: upsertError } = await supabase
      .from("hub_subscriptions")
      .upsert(record, { onConflict: "email" });

    if (upsertError) {
      console.error("[sync-from-hub] Upsert failed:", upsertError.message);
      return jsonRes(500, { error: upsertError.message });
    }

    console.log(
      `[sync-from-hub] ✅ ${email} → plan=${storedPlan} (${rawPlanId})`,
    );

    return jsonRes(200, {
      success: true,
      email,
      plan: storedPlan,
      message: "Hub subscription synced to social DB",
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unexpected error";
    console.error("[sync-from-hub] Error:", msg);
    return jsonRes(500, { error: msg });
  }
});
