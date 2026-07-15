// create-payment-link/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RAZORPAY_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID");
const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { planId, interval = 1, userId, customerName, customerEmail, customerContact } = await req.json();
    const intervalMonths = Number(interval);

    if (!userId || !planId) {
      throw new Error("userId and planId are required");
    }

    // Only "pro" (or "999" backward compat) is supported. Enterprise checkout is fail-closed.
    const planKey = String(planId).toLowerCase();
    if (planKey !== "pro" && planKey !== "999") {
      throw new Error("Enterprise and invalid plan checkouts are disabled because no matching Hub pricing plan exists");
    }

    // Validate supported billing intervals.
    if (![1, 3, 6, 12].includes(intervalMonths)) {
      throw new Error("Invalid billing interval requested");
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
        throw new Error("Unsupported currency found in Hub plan");
      }
    }

    // Lookup active social_pilot_starter
    const starterPlan = socialPricing.find((p: any) => p.plan_name === "social_pilot_starter" && p.is_active === true);
    if (!starterPlan) {
      throw new Error("Active social_pilot_starter pricing plan not found in GetAiPilot catalog");
    }

    let discountMultiplier = 1.0;
    if (intervalMonths === 3) discountMultiplier = 0.90;
    else if (intervalMonths === 6) discountMultiplier = 0.80;
    else if (intervalMonths === 12) discountMultiplier = 0.70;

    const amount = Math.round(starterPlan.amount * intervalMonths * discountMultiplier);
    const description = `QuickPost Pro Plan Subscription (${intervalMonths} Month${intervalMonths > 1 ? 's' : ''})`;

    // 2. Initialize Supabase client
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // 3. Create Payment Link in Razorpay
    const auth = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);
    const razorpayResponse = await fetch("https://api.razorpay.com/v1/payment_links", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${auth}`,
      },
      body: JSON.stringify({
        amount,
        currency: "INR",
        accept_partial: false,
        description,
        customer: {
          name: customerName || "Customer",
          email: customerEmail,
          contact: customerContact,
        },
        notify: {
          sms: false,
          email: true,
        },
        reminder_enable: true,
        notes: {
          user_id: userId,
          plan: planId,
          interval: intervalMonths.toString(),
        },
        callback_url: `${req.headers.get("origin") || "http://localhost:5173"}/dashboard?payment=success`,
        callback_method: "get",
      }),
    });

    const razorpayData = await razorpayResponse.json();

    if (!razorpayResponse.ok) {
      console.error("Razorpay Error:", razorpayData);
      throw new Error(razorpayData.error?.description || "Failed to create Razorpay payment link");
    }

    // 4. Store payment link in DB
    const { error: dbError } = await supabase.from("social_payments").insert({
      user_id: userId,
      razorpay_payment_link_id: razorpayData.id,
      plan: planId === "999" || planId === "pro" ? "Pro" : "Enterprise",
      amount,
      status: "pending",
    });

    if (dbError) {
      console.error("DB Error:", dbError);
      // We still return the link even if DB logging fails, but we should know about it
    }

    return new Response(JSON.stringify({ success: true, payment_link: razorpayData.short_url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
