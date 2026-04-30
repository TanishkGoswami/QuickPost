// verify-subscription/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RAZORPAY_KEY_ID        = Deno.env.get("RAZORPAY_KEY_ID");
const RAZORPAY_KEY_SECRET    = Deno.env.get("RAZORPAY_KEY_SECRET");
const SUPABASE_URL           = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Map social billing plan IDs → display plan name
function getPlanName(planId: string): string {
  if (!planId) return "Social Pilot";
  const p = planId.toLowerCase();
  if (p.includes("enterprise") || p.startsWith("all_in_one")) return "GAP Ultimate Ecosystem";
  return "Social Pilot"; // default for any paid plan on social
}

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
    const razorpayResponse = await fetch(
      `https://api.razorpay.com/v1/payment_links/${razorpayPaymentLinkId}`,
      { headers: { "Authorization": `Basic ${auth}` } }
    );

    const razorpayData = await razorpayResponse.json();

    if (!razorpayResponse.ok) {
      throw new Error(razorpayData.error?.description || "Failed to fetch Razorpay payment link status");
    }

    const status = razorpayData.status; // created | partial | paid | expired | cancelled
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
      const planName = getPlanName(planId); // "Social Pilot" or "GAP Ultimate Ecosystem"

      // ── 4a. UPSERT into public.users ─────────────────────────────────────
      // Use upsert so it works even if the row doesn't exist yet
      const { error: userUpsertError } = await supabase
        .from("users")
        .upsert(
          { id: userId, plan: planName, subscription_status: "active" },
          { onConflict: "id" }
        );

      if (userUpsertError) {
        console.warn("public.users upsert error:", userUpsertError.message);
      } else {
        console.log(`[verify-subscription] ✅ public.users updated → ${planName}`);
      }

      // ── 4b. Update auth user_metadata ────────────────────────────────────
      const { error: authUpdateError } = await supabase.auth.admin.updateUserById(
        userId,
        { user_metadata: { plan: planName, subscription_status: "active" } }
      );

      if (authUpdateError) {
        console.error("Auth Admin Update Error:", authUpdateError);
        throw new Error("Payment successful but failed to update user plan. Please contact support.");
      }

      // ── 4c. Get user email ────────────────────────────────────────────────
      const { data: authUser } = await supabase.auth.admin.getUserById(userId);
      const email = authUser?.user?.email;

      // ── 4d. UPSERT into hub_subscriptions ────────────────────────────────
      // This is what fetchUserProfile reads on every login to determine plan
      if (email) {
        const { error: hubSubError } = await supabase
          .from("hub_subscriptions")
          .upsert(
            {
              email,
              plan:                planName,
              plan_id:             planId,
              subscription_status: "active",
              updated_at:          new Date().toISOString(),
              synced_at:           new Date().toISOString(),
            },
            { onConflict: "email" }
          );

        if (hubSubError) {
          console.warn("hub_subscriptions upsert error:", hubSubError.message);
        } else {
          console.log(`[verify-subscription] ✅ hub_subscriptions updated → ${email} = ${planName}`);
        }
      }

      console.log(`[verify-subscription] ✅ Payment verified. User ${userId} → ${planName}`);

      return new Response(
        JSON.stringify({ success: true, status, plan: planName }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, status }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("[verify-subscription] Error:", error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
