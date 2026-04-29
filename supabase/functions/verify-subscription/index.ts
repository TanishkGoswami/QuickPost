// verify-subscription/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RAZORPAY_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID");
const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// Hub sync configuration
const HUB_SYNC_URL    = Deno.env.get("HUB_SYNC_FUNCTION_URL"); // https://uklxlappjcuvdqjvecfh.supabase.co/functions/v1/sync-from-social
const SOCIAL_SYNC_SECRET = Deno.env.get("SOCIAL_SYNC_SECRET");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { razorpayPaymentLinkId } = await req.json();

    if (!razorpayPaymentLinkId) {
      throw new Error("razorpayPaymentLinkId is required");
    }

    // 1. Fetch Payment Link status from Razorpay
    const auth = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);
    const razorpayResponse = await fetch(`https://api.razorpay.com/v1/payment_links/${razorpayPaymentLinkId}`, {
      headers: {
        "Authorization": `Basic ${auth}`,
      },
    });

    const razorpayData = await razorpayResponse.json();

    if (!razorpayResponse.ok) {
      throw new Error(razorpayData.error?.description || "Failed to fetch Razorpay payment link status");
    }

    const status = razorpayData.status; // status can be created, partial, paid, expired, cancelled
    const userId = razorpayData.notes?.user_id;
    const planId = razorpayData.notes?.plan;
    const amount = razorpayData.amount; // in paise

    // 2. Initialize Supabase client
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // 3. Update payment status in DB
    const { error: dbError } = await supabase
      .from("payments")
      .update({ status })
      .eq("razorpay_payment_link_id", razorpayPaymentLinkId);

    if (dbError) {
      console.error("DB Update Error (payments):", dbError);
    }

    // 4. If paid, update user plan
    if (status === "paid" && userId && planId) {
      const planName = planId === "999" ? "Pro" : "Enterprise";
      // Map social plan names to hub plan_ids
      const hubPlanId = planName === "Enterprise" ? "social_pilot_pro" : "social_pilot_starter";

      // Update public.users (might fail if column doesn't exist)
      const { error: userUpdateError } = await supabase
        .from("users")
        .update({ plan: planName, subscription_status: "active" })
        .eq("id", userId);

      if (userUpdateError) {
        console.warn("Could not update public.users table (maybe missing column). Falling back to auth metadata.", userUpdateError);
      }

      // Update auth user_metadata (this will always work and doesn't require SQL migrations)
      const { error: authUpdateError } = await supabase.auth.admin.updateUserById(
        userId,
        { user_metadata: { plan: planName, subscription_status: "active" } }
      );

      if (authUpdateError) {
        console.error("Auth Admin Update Error:", authUpdateError);
        throw new Error("Payment successful but failed to update user plan. Please contact support.");
      }

      // ── Get user details for hub sync ───────────────────────────────────
      const { data: userRow } = await supabase
        .from("users")
        .select("email, name, google_id, profile_picture")
        .eq("id", userId)
        .maybeSingle();

      // ── Fire-and-forget sync subscription to hub ─────────────────────────
      if (userRow?.email && HUB_SYNC_URL && SOCIAL_SYNC_SECRET) {
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days

        const syncPayload = {
          email: userRow.email,
          name: userRow.name ?? undefined,
          google_id: userRow.google_id ?? undefined,
          profile_picture: userRow.profile_picture ?? undefined,
          social_user_id: userId,
          subscription: {
            plan_id: hubPlanId,
            plan_label: planName,
            expires_at: expiresAt,
            started_at: new Date().toISOString(),
            transaction_id: razorpayPaymentLinkId,
            amount_paise: amount ?? 0,
          },
        };

        fetch(HUB_SYNC_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-sync-secret": SOCIAL_SYNC_SECRET,
          },
          body: JSON.stringify(syncPayload),
        }).then(async (r) => {
          const d = await r.json().catch(() => ({}));
          console.log("[verify-subscription] Hub sync result:", r.status, JSON.stringify(d));
        }).catch((e) => {
          console.warn("[verify-subscription] Hub sync failed (non-fatal):", e.message);
        });
      } else {
        console.warn("[verify-subscription] Hub sync skipped: missing config or user email");
      }

      return new Response(JSON.stringify({ success: true, status, plan: planName }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, status }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
