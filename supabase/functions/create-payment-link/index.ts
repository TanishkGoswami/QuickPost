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
    const { planId, userId, customerName, customerEmail, customerContact } = await req.json();

    if (!userId || !planId) {
      throw new Error("userId and planId are required");
    }

    // 1. Determine amount based on plan
    let amount = 0;
    let description = "";
    if (planId === "999") {
      amount = 999 * 100; // in paise
      description = "QuickPost Pro Plan Subscription";
    } else if (planId === "2999") {
      amount = 2999 * 100; // in paise
      description = "QuickPost Enterprise Plan Subscription";
    } else {
      throw new Error("Invalid planId");
    }

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
    const { error: dbError } = await supabase.from("payments").insert({
      user_id: userId,
      razorpay_payment_link_id: razorpayData.id,
      plan: planId === "999" ? "Pro" : "Enterprise",
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
