# GetAiPilot Subscription & Entitlement Flow Architecture

This document describes the complete lifecycle of live pricing, checkout generation, payment capture, database synchronization, and final entitlement verification for the **GetAiPilot** platform.

---

## Architecture Flow Overview

The architecture follows a distributed flow across the **Client Browser UI**, your local **Express Backend Server**, **Supabase Edge Functions**, the central **GetAiPilot Hub Server**, and the **Razorpay Payment Gateway**.

```
[Step 5: Loading Live Pricing] (The Start)
  │   Frontend requests active plans
  ▼
Client Browser UI ───(/api/billing/plans)───► Express Backend Server ───(Fetch Plans)───► GetAiPilot Hub Server
                                                                                                │
                                                                                                ▼
┌───────────────────────────────────────────────────────────────────────────────────────────────┘
│
▼
[Step 4: Checkout Portal Generation]
  │   User clicks "Upgrade to Pro"
  ▼
Client Browser UI ───(create-payment-link)───► Supabase Edge Function
                                                     │
                                                     ├──► Upsert identity to public.users
                                                     ├──► Log pending record in social_payments
                                                     └──► Request Payment Link from Razorpay API
                                                                      │
                                                                      ▼
┌──────────────────────────────────────────◄ Redirects User ◄─────────┘
│
▼
[Step 3: Payment Capture & Hub Activation]
  │   User pays on checkout portal
  ▼
Razorpay Gateway ───(Payment Webhook)───► GetAiPilot Hub Server
                                                │
                                                ├──► Mark subscription record as paid
                                                ├──► Generate invoice & calculate expires_at
                                                └──► Trigger sync webhook
                                                         │
                                                         ▼
┌────────────────────────────────────────────────────────┘
│
▼
[Step 2: Database Synchronization Webhook]
  │   Secure data pipeline
  ▼
GetAiPilot Hub Server ───(/sync-from-hub)───► Supabase Edge Function (sync-from-hub)
                                                    │
                                                    ├──► Authorize with SOCIAL_SYNC_SECRET
                                                    └──► Upsert data into local hub_subscriptions
                                                                    │
                                                                    ▼
┌───────────────────────────────────────────────────────────────────┘
│
▼
[Step 1: Entitlement Verification & Dashboard Access] (The End)
  │   User opens the dashboard
  ▼
Client Browser UI ───(/api/billing/entitlements)───► Express Backend Server (entitlements.js)
                                                           │
                                                           ├──► Run getEntitlements(userId, email, token)
                                                           ├──► Query local hub_subscriptions table
                                                           ├──► Find callmetanishk@gmail.com
                                                           │    (plan_id: "social_pilot_starter", status: "created")
                                                           └──► Verify status is active & expires_at is future
                                                                            │
                                                                            ▼
                                                     [ UI Unlocks Pro Plan Features 🎉 ]
```

---

## Detailed Component Lifecycle

### Step 5: Loading Live Pricing (The Start)
* **Location:** Express Backend Server $
ightarrow$ GetAiPilot Hub Server
* **Flow Description:** 
  When the application dashboard initializes, the frontend communicates with the `/api/billing/plans` endpoint to populate available subscription tier cards. The local Express server uses the designated authority tokens (`HUB_SUPABASE_URL` and `HUB_SUPABASE_ANON_KEY`) to fetch and present the most up-to-date, dynamic pricing options from the Hub API.

### Step 4: Checkout Portal Generation (`create-payment-link`)
* **Location:** Client UI $
ightarrow$ Supabase Edge Function (`create-payment-link`)
* **Flow Description:** 
  When a user initiates an upgrade via the pricing layout, the browser calls the `create-payment-link` Supabase Edge Function, carrying `userId`, `email`, and `name`. 
  1. The function triggers a rapid-fail upsert into `public.users` to maintain database foreign key constraints.
  2. It writes a placeholder entry inside the `social_payments` table with a state of pending.
  3. It signs a request to Razorpay's API to construct a customized portal link and reflects that web target back to the frontend for UI redirection.

### Step 3: Payment Capture & Hub Activation
* **Location:** Razorpay Payment Gateway $
ightarrow$ GetAiPilot Hub Server
* **Flow Description:** 
  The checkout session finishes inside Razorpay's context. Razorpay securely dispatches a transaction confirmation webhook to the central GetAiPilot Hub Server. The Hub processes the payment confirmation, transitions the user's master subscription entry to a paid tier state, dynamically processes an invoice, projects the `expires_at` date out exactly 1 month, and signals the internal distribution sync pipeline.

### Step 2: Database Synchronization Webhook (`sync-from-hub`)
* **Location:** GetAiPilot Hub Server $
ightarrow$ Supabase Edge Function (`sync-from-hub`)
* **Flow Description:** 
  The Hub pushes an authenticated HTTP POST payload containing user and billing state properties (`email`, `name`, `plan_id`, `subscription_status`, `expires_at`) to the Supabase Edge Function endpoint. The function checks for validity using the `SOCIAL_SYNC_SECRET` handshake, flattens/normalizes any structural variances, and applies an upsert query to store the record inside the local database's `hub_subscriptions` view block.

### Step 1: Entitlement Verification & Dashboard Access (The End)
* **Location:** Client Browser UI $
ightarrow$ Express Backend Server (`entitlements.js`)
* **Flow Description:** 
  Upon layout loading, the client fires an evaluation handshake request to `/api/billing/entitlements`. The backend executes `getEntitlements(userId, email, token)` to parse the user identity metadata. It checks the localized `hub_subscriptions` table against the provided email identifier. 
  * *Example matching criteria:* Finds target string `callmetanishk@gmail.com` with properties `plan_id: "social_pilot_starter"` and `subscription_status: "created"`.
  The routing code validates that the status indicates a healthy subscription tier state and ensures `expires_at` points ahead of current runtime. Pro feature limits are returned, lifting restriction toggles inside the application UI.

---

## Security & Reliability Controls

1. **Foreign Key Integrity:** Step 4 implements a fast-fail query mechanism to eliminate downstream database errors during user lifecycle progression.
2. **Payload Protection:** Step 2 demands validation of the inbound payload string structure matching the configured `SOCIAL_SYNC_SECRET` signature before granting write access to subscription states.
3. **Decoupled Verification:** Dashboard loading routines read directly from local replica structures created in Step 2, preventing dependency blockages from external network delays during routine platform usage.