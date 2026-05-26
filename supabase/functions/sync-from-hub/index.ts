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
function isSocialPlan(planValue: string): boolean {
  if (!planValue) return false;
  const p = planValue.toLowerCase().trim();
  return (
    p.startsWith("social_pilot") ||
    p.startsWith("all_in_one") ||
    p === "social pilot" ||
    p === "gap ultimate ecosystem"
  );
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

    const rawPlanId = plan_id || plan || "";
    // Store exact plan_label from hub if this is a social-relevant plan
    // plan_label comes in as e.g. "Social Pilot" or "GAP Ultimate Ecosystem"
    const planLabel = body.plan_label || null;
    const subscriptionStatus = body.subscription_status || "active";
    const hasSocial = isSocialPlan(rawPlanId) || isSocialPlan(planLabel || "");

    // If payload is incomplete (no plan_id/plan_label), do not downgrade existing paid users.
    const { data: existingSub } = await supabase
      .from("hub_subscriptions")
      .select("plan, plan_id, subscription_status")
      .eq("email", email)
      .maybeSingle();

    const existingPaid = isSocialPlan(existingSub?.plan_id || "") || isSocialPlan(existingSub?.plan || "");

    let storedPlan = "Free";
    if (hasSocial) {
      storedPlan =
        planLabel ||
        (rawPlanId.toLowerCase().startsWith("all_in_one")
          ? "GAP Ultimate Ecosystem"
          : "Social Pilot");
    } else if (!rawPlanId && existingPaid) {
      storedPlan = existingSub?.plan || "Social Pilot";
    }

    // ── Upsert into hub_subscriptions (email as primary key) ──────────────
    // No auth user creation. No UUID conflicts. Simple and fast.
    const record: Record<string, unknown> = {
      email,
      plan: storedPlan,
      plan_id: rawPlanId || existingSub?.plan_id || null,
      subscription_status: hasSocial
        ? subscriptionStatus
        : (!rawPlanId && existingPaid ? (existingSub?.subscription_status || "active") : "active"),
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
