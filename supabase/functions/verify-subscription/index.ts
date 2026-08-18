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
  if (p.includes("all_in_one_bundle_monthly")) return "GAP Core";
  if (p.includes("all_in_one_bundle_quarterly")) return "GAP Pro";
  if (p.includes("all_in_one_bundle_half_yearly")) return "GAP Max";
  if (p.includes("enterprise") || p.startsWith("all_in_one") || p.includes("ultimate")) return "GAP Ultimate Ecosystem";
  return "Social Pilot"; // default for any paid plan on social
}

function getStandalonePlanId(planId: string): "slite" | "sgrowth" | null {
  const normalized = String(planId || "").toLowerCase();
  if (normalized === "999" || normalized === "pro" || normalized === "slite") return "slite";
  if (normalized === "1999" || normalized === "2999" || normalized === "enterprise" || normalized === "sgrowth") return "sgrowth";
  return null;
}

// Standalone amounts validation has been replaced by dynamic fetching from GetAiPilot.

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
    const amount = Number(razorpayData.amount); // expected amount in paise
    const amountPaid = Number(razorpayData.amount_paid ?? razorpayData.amount);

    // 2. Initialize Supabase client
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // 3. Update payment status in DB
    const { error: dbError } = await supabase
      .from("social_payments")
      .update({ status })
      .eq("razorpay_payment_link_id", razorpayPaymentLinkId);

    if (dbError) {
      console.error("DB Update Error (payments):", dbError);
    }

    // 4. If paid, update user plan
    if (status === "paid" && userId && planId) {
      const standalonePlanId = getStandalonePlanId(planId);
      const planName = standalonePlanId
        ? (standalonePlanId === "sgrowth" ? "Growth" : "Starter")
        : getPlanName(planId);

      let intervalMonths = 1;
      if (standalonePlanId) {
        const interval = Number(razorpayData.notes?.interval || "1");
        if (![1, 3, 6, 12].includes(interval)) {
          throw new Error("Invalid billing interval verified");
        }

        const HUB_SUPABASE_URL = Deno.env.get("HUB_SUPABASE_URL");
        const HUB_SUPABASE_ANON_KEY = Deno.env.get("HUB_SUPABASE_ANON_KEY");

        if (!HUB_SUPABASE_URL || !HUB_SUPABASE_ANON_KEY) {
          throw new Error("GetAiPilot pricing credentials are not configured in environment variables");
        }

        // Fetch dynamic pricing from GetAiPilot
        const hubPricingUrl = `${HUB_SUPABASE_URL}/functions/v1/get-pricing?category=social&currency=INR`;
        const pricingResponse = await fetch(hubPricingUrl, {
          method: "GET",
          headers: {
            "apikey": HUB_SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${HUB_SUPABASE_ANON_KEY}`,
          },
        });

        if (!pricingResponse.ok) {
          throw new Error(`Failed to fetch pricing from GetAiPilot: ${pricingResponse.statusText}`);
        }

        const pricingData = await pricingResponse.json();
        if (!pricingData || typeof pricingData !== "object" || !Array.isArray(pricingData.plans)) {
          throw new Error("Invalid pricing response format from GetAiPilot");
        }

        if (pricingData.currency !== "INR") {
          throw new Error(`Authoritative pricing response contains unsupported currency: ${pricingData.currency}`);
        }

        const socialPricing = pricingData.plans;

        // Validate duplicates
        const planNames = socialPricing.map((p: any) => p.plan_name);
        const hasDuplicates = planNames.some((name: string, index: number) => planNames.indexOf(name) !== index);
        if (hasDuplicates) {
          throw new Error("Duplicate plan_name records found in Hub pricing response");
        }

        // Validate active plans structure
        for (const plan of socialPricing) {
          if (plan.is_active !== true) continue;
          if (typeof plan.amount !== "number" || plan.amount <= 0) {
            throw new Error(`Invalid amount found in Hub plan: ${plan.plan_name}`);
          }
          if (plan.currency !== "INR") {
            throw new Error(`Unsupported currency found in Hub plan: ${plan.plan_name}`);
          }
        }

        const hubPlanName = standalonePlanId === "sgrowth" ? "social_pilot_growth" : "social_pilot_starter";
        const hubPlan = socialPricing.find((p: any) => p.plan_name === hubPlanName && p.is_active === true);
        if (!hubPlan) {
          throw new Error(`Active ${hubPlanName} pricing plan not found in GetAiPilot catalog`);
        }

        let discountMultiplier = 1.0;
        if (interval === 3) discountMultiplier = 0.90;
        else if (interval === 6) discountMultiplier = 0.80;
        else if (interval === 12) discountMultiplier = 0.70;

        const expectedAmount = Math.round(hubPlan.amount * interval * discountMultiplier);
        if (amountPaid !== expectedAmount) {
          throw new Error("Razorpay payment amount is incomplete or inconsistent with authoritative Hub pricing.");
        }

        intervalMonths = interval;
      } else {
        intervalMonths = Math.max(1, Number.parseInt(razorpayData.notes?.interval || "1", 10) || 1);
      }

      if (standalonePlanId && amountPaid !== amount) {
        throw new Error("Razorpay payment amount is incomplete or inconsistent.");
      }

      // ── 4a. UPSERT into public.users ─────────────────────────────────────
      // Use upsert so it works even if the row doesn't exist yet
      if (!standalonePlanId) {
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
      }

      // ── 4b. Update auth user_metadata ────────────────────────────────────
      if (!standalonePlanId) {
        const { error: authUpdateError } = await supabase.auth.admin.updateUserById(
          userId,
          { user_metadata: { plan: planName, subscription_status: "active" } }
        );

        if (authUpdateError) {
          console.error("Auth Admin Update Error:", authUpdateError);
          throw new Error("Payment successful but failed to update user plan. Please contact support.");
        }
      }

      // ── 4c. Get user email ────────────────────────────────────────────────
      let email;
      if (!standalonePlanId) {
        const { data: authUser } = await supabase.auth.admin.getUserById(userId);
        email = authUser?.user?.email;
      }

      // ── 4d. UPSERT into hub_subscriptions ────────────────────────────────
      // This is what fetchUserProfile reads on every login to determine plan
      if (!standalonePlanId && email) {
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

      // Standalone QuickPost entitlement. Payment links sell fixed access
      // periods; recurring provider webhooks can update this same record later.
      if (standalonePlanId) {
        const activationPlanId = standalonePlanId === "sgrowth" ? "enterprise" : "pro";
        const { data: activationRows, error: appSubscriptionError } = await supabase.rpc(
          "activate_fixed_term_subscription",
          {
            p_user_id: userId,
            p_plan_id: activationPlanId,
            p_provider: "razorpay",
            p_provider_payment_id: razorpayPaymentLinkId,
            p_interval_months: intervalMonths,
            p_amount_paid: amountPaid,
          },
        );

        if (appSubscriptionError) {
          console.error("app_subscriptions upsert error:", appSubscriptionError);
          throw new Error("Payment succeeded but standalone access could not be activated.");
        }

        const activation = activationRows?.[0];
        if (activation?.processed === false) {
          return new Response(
            JSON.stringify({
              success: true,
              status,
              plan: planName,
              cached: true,
              current_period_end: activation.period_end,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
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
