# QuickPost Subscription and Entitlement Implementation

## Purpose

This document records every subscription, pricing, entitlement, usage-limit, database, client, server, and Supabase deployment change made during the current implementation.

The goal was to make QuickPost capable of operating as a standalone SaaS with three plans while preserving compatibility with the existing GetAIPilot Hub plan system. The standalone entitlement model is deliberately separated from `hub_subscriptions`, allowing Hub synchronization to be added or replaced later without rewriting feature enforcement.

Implementation date: June 27, 2026.

Supabase target:

- Project name: `autopost application`
- Project reference: `oqaysrnncwbtrujnxsdo`
- Region: `ap-south-1`

---

## 1. Canonical QuickPost Plans

### File added

`server/src/config/plans.js`

This is now the server-side catalogue for the three QuickPost plans:

- `free`
- `pro`
- `enterprise`

It exports:

- `PLAN_IDS`
- `PLANS`
- `getPlan(planId)`

Unknown or missing plan IDs fall back safely to Free.

### Free plan

Price:

- Monthly: ₹0
- Annual: ₹0

Features:

- Publishing
- Scheduling
- Auto-DM trial access
- No advanced analytics
- No approval workflow
- No API access
- No priority support

Limits:

- 1 social account
- 20 posts per month
- 10 posts in the scheduled queue
- 1 team member
- 7 days of history
- 1 Auto-DM Instagram account
- 1 Auto-DM automation
- 50 Auto-DM replies per day
- 100 contacts

### Pro plan

Price:

- Monthly: ₹999
- Annual: ₹9,588

Features:

- Publishing
- Scheduling
- Analytics
- Auto-DM
- Priority support
- No approval workflow
- No public API access

Limits:

- 10 social accounts
- 500 posts per month
- 250 posts in the scheduled queue
- 1 team member
- 90 days of history
- 5 Auto-DM Instagram accounts
- 25 Auto-DM automations
- 1,000 Auto-DM replies per day
- 5,000 contacts

### Enterprise plan

Price:

- Monthly: ₹2,999
- Annual: ₹29,988

Features:

- Publishing
- Scheduling
- Analytics
- Auto-DM
- Approval workflows
- API access
- Priority support

Limits:

- 30 social accounts
- 2,500 posts per month
- 1,000 posts in the scheduled queue
- 10 team members
- 365 days of history
- 15 Auto-DM Instagram accounts
- 100 Auto-DM automations
- 5,000 Auto-DM replies per day
- 25,000 contacts

---

## 2. Standalone Subscription Database

### Migration added

`supabase/migrations/202606270001_quickpost_entitlements.sql`

This migration was applied to the remote Supabase database.

### `app_subscriptions` table

This table stores standalone, Hub, and manually assigned subscription records.

Columns added:

- `id`
- `user_id`
- `plan_id`
- `source`
- `provider`
- `provider_customer_id`
- `provider_subscription_id`
- `billing_interval`
- `status`
- `current_period_start`
- `current_period_end`
- `trial_ends_at`
- `cancel_at_period_end`
- `cancelled_at`
- `grace_period_ends_at`
- `metadata`
- `created_at`
- `updated_at`

Allowed plan IDs:

- `free`
- `pro`
- `enterprise`

Allowed subscription sources:

- `standalone`
- `hub`
- `admin`

Allowed billing intervals:

- `month`
- `year`

Allowed subscription statuses:

- `trialing`
- `active`
- `past_due`
- `paused`
- `cancelled`
- `expired`

Constraints and indexes:

- One subscription row per user and source.
- Provider subscription identifiers are unique when present.
- User and status lookup index.
- Subscription rows are deleted when their Supabase Auth user is deleted.

### `entitlement_usage` table

This table stores metered usage by user, metric, and period.

Columns:

- `user_id`
- `metric`
- `period_start`
- `period_end`
- `used`
- `updated_at`

The primary key is:

```text
user_id + metric + period_start
```

This prevents duplicate usage rows for the same metric and period.

An additional user/period index supports current-usage lookups.

### Row-Level Security

RLS was enabled on:

- `app_subscriptions`
- `entitlement_usage`

Policies added:

- Authenticated users can read only their own application subscription.
- Authenticated users can read only their own usage.
- Client-side subscription and usage writes are not permitted.
- Usage mutation is performed through a service-role-only database function.

### Atomic usage function

Database function added:

```sql
public.consume_entitlement_usage(...)
```

Arguments:

- User ID
- Metric
- Amount to consume
- Plan limit
- Period start
- Period end

Returned values:

- Whether the operation was allowed
- Current usage
- Limit value

Concurrency protection:

- Uses a transaction-scoped advisory lock for each user, metric, and period.
- Reads current usage while holding the lock.
- Rejects increments that would exceed the plan limit.
- Inserts or updates usage atomically.
- Prevents simultaneous requests from both passing the same final quota slot.

Security:

- Removed execution access from `public`, `anon`, and `authenticated`.
- Granted execution only to `service_role`.
- Uses a fixed `search_path`.

---

## 3. Server Entitlement Resolution

### File added

`server/src/services/entitlements.js`

### Subscription validity

A subscription is treated as usable only when its status and dates permit access.

Supported access statuses:

- `active`
- `trialing`

The resolver evaluates:

- Subscription status
- Current period end
- Trial end
- Grace-period end

Invalid, missing, expired, or unusable subscriptions fall back to the Free plan.

### `getEntitlements(userId)`

This function loads:

- Latest application subscription
- Canonical plan
- Features
- Limits
- Current usage records

It returns:

```json
{
  "plan": {},
  "subscription": {},
  "features": {},
  "limits": {},
  "usage": {}
}
```

If the new database tables have not yet been created, missing-table errors are handled as a temporary Free fallback.

### `consumeUsage(...)`

This function:

1. Resolves the current plan.
2. Gets the applicable metric limit.
3. Calculates either the current UTC month or UTC day.
4. Calls the atomic Postgres usage function.
5. Returns the reservation result and entitlements.

Supported cadence values:

- Monthly
- Daily

### `countUserResource(...)`

This helper counts existing user-owned database resources.

It supports additional equality filters, for example:

```js
{ is_connected: true }
```

It is used for capacity limits such as connected Instagram accounts and Auto-DM automations.

---

## 4. Entitlement Middleware

### File added

`server/src/middleware/entitlements.js`

### `requireFeature(feature)`

This middleware:

- Resolves the authenticated user’s entitlements.
- Verifies that the requested feature is enabled.
- Returns HTTP 403 if unavailable.
- Adds entitlements to the request when allowed.

Failure code:

```text
FEATURE_NOT_INCLUDED
```

### `reserveUsage(metric, options)`

This middleware:

- Atomically reserves metered usage.
- Supports an amount and cadence.
- Rejects requests after the quota is exhausted.

Failure code:

```text
PLAN_LIMIT_REACHED
```

The response includes:

- Metric
- Current usage
- Limit
- Current plan

### `requireResourceCapacity(metric, table, filters)`

This middleware:

- Resolves the plan limit.
- Counts current resources.
- Rejects creation when current usage has reached the limit.

It allows resource reads, edits, and deletions while preventing additional creation beyond the plan.

### Identity handling

Entitlements use the original Supabase Auth user ID:

```text
req.user.authUserId
```

Resource ownership checks continue using the application’s resolved public user ID:

```text
req.user.userId
```

This avoids foreign-key problems when legacy account identity mapping produces a public user ID different from the Supabase Auth ID.

---

## 5. Billing API

### File added

`server/src/routes/billing.js`

### Public plans endpoint

```http
GET /api/billing/plans
```

Returns the canonical Free, Pro, and Enterprise catalogue.

### Authenticated entitlement endpoint

```http
GET /api/billing/entitlements
```

Requirements:

- Valid Supabase bearer token

Returns:

- Current canonical plan
- Subscription state
- Feature flags
- Limits
- Usage

### Server registration

Modified:

`server/src/index.js`

The billing router is mounted at:

```text
/api/billing
```

---

## 6. Publishing Enforcement

### File modified

`server/src/routes/broadcast.js`

The broadcast creation pipeline now runs in this order:

1. Authenticate user.
2. Require the `publishing` feature.
3. Parse uploaded media.
4. Reject a request with no media.
5. Reserve one `posts_per_month` usage unit.
6. Create and process the broadcast job.

This ensures:

- Users without publishing access cannot publish.
- Users at their monthly limit receive HTTP 403.
- Invalid requests without media do not consume post quota.
- The limit is enforced server-side rather than relying on React.

Structured errors use:

```text
FEATURE_NOT_INCLUDED
PLAN_LIMIT_REACHED
```

---

## 7. Auto-DM Enforcement

### File modified

`server/src/routes/autodm.js`

### Instagram account import

The following route is now protected:

```http
POST /api/autodm/import-instagram
```

Checks:

- User is authenticated.
- Plan includes `autodm`.
- Current connected Instagram account count is below `autodm_accounts`.

Only connected rows with `is_connected = true` are counted.

### Automation creation

The following route is now protected:

```http
POST /api/autodm/automations
```

Checks:

- User is authenticated.
- Plan includes `autodm`.
- Current automation count is below `autodm_automations`.

Reading, editing, and deleting existing automations were not blocked by the creation limit.

---

## 8. Client Authentication and Plan Hydration

### File modified

`client/src/context/AuthContext.jsx`

The profile loader now fetches these three sources in parallel:

1. Legacy `users` plan record.
2. Existing `hub_subscriptions` record.
3. New `/api/billing/entitlements` response.

This reduces sequential request waiting and preserves existing Hub compatibility.

### Standalone priority

A paid standalone subscription becomes authoritative when:

```text
subscription.source = standalone
and plan.id != free
```

When this is true:

- Display plan comes from the standalone entitlement.
- Subscription status comes from the standalone subscription.
- Legacy GAP plan-name normalization is skipped.

This prevents standalone `Pro` from incorrectly being renamed to `Social Pilot`.

### Legacy fallback

When there is no paid standalone subscription, the existing order remains:

1. Hub subscription
2. Local users table
3. Auth user metadata
4. Free

Legacy GAP name normalization remains active only on this fallback path.

### User context

The authenticated user object now includes:

```js
user.entitlements
```

This gives client pages access to:

- Features
- Limits
- Usage
- Canonical plan
- Subscription lifecycle fields

---

## 9. Pricing Consistency Changes

### Files modified

- `client/src/features/landing/components/Pricing.jsx`
- `client/src/pages/PricingPage.jsx`
- `client/src/pages/BillingPage.jsx`

Pro prices were aligned to:

| Duration | Monthly rate | Total |
|---|---:|---:|
| 1 month | ₹999 | ₹999 |
| 3 months | ₹899 | ₹2,697 |
| 6 months | ₹799 | ₹4,794 |
| 12 months | ₹799 | ₹9,588 |

Previous inconsistencies removed:

- Some pages showed ₹699/month annually.
- Billing showed ₹849/month for six months.
- Other pages and the payment function used different values.

---

## 10. Razorpay Payment-Link Changes

### File modified

`supabase/functions/create-payment-link/index.ts`

Accepted Pro IDs:

- Legacy: `999`
- Canonical: `pro`

Accepted Enterprise IDs:

- Legacy: `2999`
- Canonical: `enterprise`

### Pro checkout amounts

- 1 month: ₹999/month
- 3 months: ₹899/month
- 6 months: ₹799/month
- 12 months: ₹799/month

Amounts are converted to paise and rounded.

### Enterprise checkout amounts

- Standard interval price: ₹2,999 × number of months
- Annual total: ₹29,988

The payment description now includes the selected duration for Enterprise.

Payment rows now correctly store `Pro` for either `999` or `pro`; other accepted standalone IDs store `Enterprise`.

---

## 11. Razorpay Subscription Verification Changes

### File modified

`supabase/functions/verify-subscription/index.ts`

### Standalone plan mapping

Added explicit mappings:

```text
999        -> pro
pro        -> pro
2999       -> enterprise
enterprise -> enterprise
```

Legacy Hub/GAP plan mapping remains available for non-standalone plan IDs.

### Correct display names

Standalone purchases now resolve to:

- `Pro`
- `Enterprise`

They no longer fall through to the generic `Social Pilot` name.

### Fixed access period

For standalone QuickPost plans, the purchased interval is derived from the
fully paid Razorpay amount. Payment-link notes are not trusted to determine the
duration.

On successful payment:

- If the user has unexpired standalone access, `current_period_start` is set to
  the existing `current_period_end`.
- Otherwise, `current_period_start` is set to activation time.
- `current_period_end` is calculated by adding the purchased number of months
  to that start, so legitimate repeat purchases stack instead of replacing
  remaining access.
- Twelve-month purchases use `billing_interval = year`.
- Other durations use `billing_interval = month`.

### Standalone subscription activation

A successful standalone payment now upserts into:

```text
app_subscriptions
```

Stored fields:

- User ID
- Canonical plan ID
- Source: `standalone`
- Provider: `razorpay`
- Razorpay payment-link ID
- Billing interval
- Active status
- Current period start/end
- Cancellation setting
- Updated timestamp

The existing `user_id + source` subscription row remains the current entitlement
snapshot. Permanent payment idempotency is enforced separately by the unique
`provider + provider_payment_id` record in
`subscription_payment_activations`. Activation and subscription update occur in
one locked database transaction.

If payment succeeds but the new subscription record cannot be activated, verification returns an explicit activation error instead of silently claiming success.

### Existing compatibility writes retained

Successful verification still updates:

- `payments`
- `public.users`
- Supabase Auth user metadata
- `hub_subscriptions`

This preserves existing application behavior during migration to the new entitlement model.

---

## 12. Supabase Function Configuration

### File modified

`supabase/config.toml`

Configuration now explicitly contains:

```toml
[functions.webhook]
verify_jwt = false

[functions.oauth-callback]
verify_jwt = false

[functions.oauth-start]
verify_jwt = true

[functions.sync-from-hub]
verify_jwt = false
```

`sync-from-hub` does not use Supabase JWT verification because it authenticates server-to-server requests using `x-sync-secret`.

---

## 13. Supabase Database Deployment

The local repository was linked to:

```text
oqaysrnncwbtrujnxsdo
```

### Migration-history repair

Two legacy date-only migration versions existed remotely under names that did not match the local filenames:

- `20260429`
- `20260526`

The CLI-recommended repair was run:

```text
Mark 20260429 and 20260526 as reverted
```

They were then safely reapplied because their SQL is idempotent.

### Migrations applied during deployment

- `20260429_add_plan_to_users.sql`
- `20260526_instapilot_schema.sql`
- `20260527_instapilot_bot_controls.sql`
- `202606270001_quickpost_entitlements.sql`

Existing objects produced expected `already exists, skipping` notices.

The new entitlement migration completed successfully.

### Migration verification

The remote database now records these new pending versions as applied:

- `20260527`
- `202606270001`

The two legacy short-version entries still appear twice in `supabase migration list` because their local and historical remote names differ. Their SQL is present and applied; this is migration-history naming debt rather than missing schema.

---

## 14. Supabase Edge Function Deployment

All local Edge Functions were deployed to the `autopost application` project:

- `create-payment-link`
- `instagram-media`
- `oauth-callback`
- `oauth-start`
- `sync-from-hub`
- `sync-to-hub`
- `verify-subscription`
- `webhook`

Remote verification reported every deployed function as `ACTIVE`.

Observed JWT settings after deployment:

| Function | JWT verification |
|---|---|
| `create-payment-link` | Enabled |
| `instagram-media` | Enabled |
| `oauth-callback` | Disabled |
| `oauth-start` | Enabled |
| `sync-from-hub` | Disabled; protected by sync secret |
| `sync-to-hub` | Disabled |
| `verify-subscription` | Enabled |
| `webhook` | Disabled |

An existing remote-only `bulk-sync-to-hub` function remains active and was not modified because it is not present in this repository.

---

## 15. Validation Performed

### Server syntax checks

`node --check` passed for the modified and added server modules, including:

- Plan catalogue
- Entitlement service
- Entitlement middleware
- Billing router
- Broadcast route
- Auto-DM route
- Server entrypoint

### Git diff validation

`git diff --check` completed without whitespace errors.

Line-ending warnings were reported because Git will convert LF to CRLF on Windows; these were not syntax or application errors.

### Client production build

The Vite production build completed successfully:

- 2,077 modules transformed
- Production assets generated
- No compilation failures

Existing non-blocking warnings:

- Browserslist data is outdated.
- One dashboard chunk is larger than the configured warning threshold.

### Remote deployment validation

Verified:

- Database connection succeeded.
- Pending SQL migrations applied.
- New migration is recorded remotely.
- All eight deployed Edge Functions are active.

---

## 16. Files Added

- `server/src/config/plans.js`
- `server/src/services/entitlements.js`
- `server/src/middleware/entitlements.js`
- `server/src/routes/billing.js`
- `supabase/migrations/202606270001_quickpost_entitlements.sql`
- `QUICKPOST_SUBSCRIPTION_IMPLEMENTATION.md`

---

## 17. Files Modified

- `client/src/context/AuthContext.jsx`
- `client/src/features/landing/components/Pricing.jsx`
- `client/src/pages/BillingPage.jsx`
- `client/src/pages/PricingPage.jsx`
- `server/src/index.js`
- `server/src/routes/autodm.js`
- `server/src/routes/broadcast.js`
- `supabase/config.toml`
- `supabase/functions/create-payment-link/index.ts`
- `supabase/functions/verify-subscription/index.ts`

The Supabase CLI also updated its local temporary metadata under `supabase/.temp/` when the project was linked and deployed. That directory is operational CLI state rather than application logic.

---

## 18. What Is Working Now

- QuickPost has canonical Free, Pro, and Enterprise definitions.
- Standalone subscriptions can be stored independently of Hub subscriptions.
- Successful standalone Razorpay payments activate time-bounded access.
- Subscription status and period dates control entitlement resolution.
- Missing or invalid subscriptions safely fall back to Free.
- Client authentication receives canonical entitlements.
- Existing Hub-paid users retain their legacy plan fallback.
- Publishing access is checked on the server.
- Monthly post usage is atomically enforced.
- Auto-DM feature access is checked on the server.
- Auto-DM account capacity is enforced.
- Auto-DM automation capacity is enforced.
- Client code can read feature flags, limits, and usage from `user.entitlements`.
- SQL and Edge Function changes are live in the remote Supabase project.

---

## 19. Remaining Work

The foundation is deployed, but the following work is still required for a complete production SaaS billing system.

### Billing-provider lifecycle

- Replace fixed-term payment links with Razorpay recurring subscriptions if automatic renewal is required.
- Add signed Razorpay webhooks.
- Handle payment success independently of browser redirects.
- Handle renewal.
- Handle failed payments.
- Handle cancellation.
- Handle pause/resume.
- Handle refunds.
- Handle disputes and chargebacks.
- Add idempotency records for provider webhook events.
- Store a Razorpay customer ID separately from payment-link IDs.

### Security hardening

- Derive checkout user identity from the authenticated JWT instead of accepting `userId` from the request body.
- Restrict payment function CORS to approved production origins.
- Validate allowed intervals entirely on the server.
- Review `sync-to-hub`, which is currently deployed without Supabase JWT verification and does not visibly enforce a custom secret in its handler.
- Clean up the old permissive `hub_subscriptions` read policy.
- Ensure only service-role code can modify standalone subscription records.

### Remaining entitlement enforcement

- Social account connection count.
- Scheduled queue capacity.
- Daily Auto-DM reply execution.
- Contact count.
- Team-member seats.
- Analytics access.
- History retention.
- Approval workflows.
- API access and rate limits.
- AI credits.
- Media storage limits.
- Enterprise exports and reporting.
- Composer-created Auto-DM automation paths that bypass the explicit Auto-DM creation route.

### Usage lifecycle

- Release or compensate reserved post usage when a background publishing job fails before any platform attempt.
- Add daily usage for automated replies.
- Add AI-credit usage.
- Add API-request usage.
- Add scheduled jobs for expiry, grace periods, and downgrade application.

### Client billing experience

- Add the Enterprise card to every pricing surface.
- Replace duplicated pricing arrays with data from `/api/billing/plans`.
- Build usage meters.
- Display renewal/expiry date.
- Add cancellation/reactivation controls.
- Add invoice/payment history.
- Add failed-payment warnings.
- Show structured upgrade dialogs for `PLAN_LIMIT_REACHED`.
- Remove or implement unsupported trial, proration, and refund claims.

### Testing

- Database tests for the atomic usage function.
- Concurrent quota-consumption tests.
- Free/Pro/Enterprise boundary tests.
- Payment-verification idempotency tests.
- Expired subscription tests.
- Trial and grace-period tests.
- Upgrade and downgrade tests.
- Auto-DM daily quota tests.
- End-to-end checkout and entitlement activation tests.

### Migration maintenance

- Normalize the historical names for migration versions `20260429` and `20260526` so future `migration list` output no longer displays duplicate local/remote rows.

---

## 20. Checkout Write Separation (June 29, 2026)

### File modified

`supabase/functions/verify-subscription/index.ts`

### Legacy Write Bypassing

The Razorpay webhook handling payment success for QuickPost now strictly bypasses legacy user mutations when purchasing a standalone QuickPost plan (`Pro` or `Enterprise`). 

Previously, a standalone purchase would still upsert data into:
- `public.users` (plan and status)
- Supabase Auth user metadata (plan and status)
- `hub_subscriptions` (plan, status, synced_at)

These writes have been wrapped in an `if (!standalonePlanId)` condition. 
Now, when a user purchases a standalone QuickPost plan, it **only** updates the `app_subscriptions` table. The `hub_subscriptions` table is no longer mutated during QuickPost checkout, cementing it as an optional bundled entitlement sync mechanism maintained purely via the `sync-from-hub` function. This makes QuickPost completely standalone and decouples it entirely from Hub labels.

---

## 21. Pivot to Unlimited Growth Model (June 29, 2026)

### Files modified
- `server/src/config/plans.js`
- `client/src/pages/BillingPage.jsx`
- `client/src/features/landing/components/Pricing.jsx`
- `QUICKPOST_PLANS.md`

### Implementation
The billing limits for the `Pro` and `Enterprise` plans have been vastly increased (represented in the codebase as `1,000,000` to simulate infinity) to reflect a new **Aggressive Growth Model**.
Instead of gating usage by the number of replies or contacts, all paid plans now offer **UNLIMITED** auto-DM replies, trigger words, scheduled monthly posts, and contacts. The gating is now strictly done by:
- Number of connected social channels
- Number of connected Instagram accounts for Auto-DM
- Team collaboration features (e.g. approval workflows, API access)

This strategically positions QuickPost against competitors like ManyChat (which penalizes audience growth with a contact tax) and Buffer (which penalizes channel additions via per-channel pricing).

---

## 22. Pivot to Indian Market Strategy (June 29, 2026)

### Files modified
- `server/src/config/plans.js`
- `client/src/pages/BillingPage.jsx`
- `client/src/features/landing/components/Pricing.jsx`
- `QUICKPOST_PLANS.md`

### Implementation
The strategic positioning of QuickPost was refined to aggressively target the Indian creator and agency market, building strong moats against competitors (ManyChat, Superprofile, Buffer, ReplyKaro, KrossPost).

**Backend Updates:**
- Increased the `autodm_accounts` limit in `plans.js` to **10** for the Pro plan and **30** for the Enterprise plan.

**Frontend & Copy Updates:**
- Reflected the new IG account limits in the React Pricing arrays (`BillingPage.jsx` and `Pricing.jsx`).
- Introduced the **Hinglish & Hindi trigger matching** feature as a major USP in the pricing cards. This communicates to Indian users that the NLP matching logic explicitly handles variations like "link dedo" or "bhai send kardo", setting it apart from exact-match English competitors.
- Rewrote the canonical `QUICKPOST_PLANS.md` document to include the Indian market competitive moats (Moat 1: Multi-Account Price Advantage, Moat 2: Scheduling Included, Moat 3: Hinglish Matching).

---

## 23. Atomic Payment Activation and Period Stacking (June 29, 2026)

### Files modified

- `supabase/functions/create-payment-link/index.ts`
- `supabase/functions/verify-subscription/index.ts`

### Migration added

- `supabase/migrations/202606290001_atomic_subscription_activation.sql`

### Permanent payment idempotency

Successful QuickPost payment activations are now recorded in
`subscription_payment_activations`, with a unique constraint on provider and
payment-link ID. A paid link can therefore activate access only once, including
after later purchases replace the latest provider ID on `app_subscriptions`.

Repeated verification of an already processed link returns the original
activation result with `cached: true` and does not alter subscription dates.

### Atomic activation

The service-role-only `activate_fixed_term_subscription(...)` database function:

- Serializes activations for each user with an advisory transaction lock.
- Permanently records the provider payment.
- Stacks a new purchase on the existing future `current_period_end`.
- Starts from the current time when no unexpired period exists.
- Updates the standalone subscription in the same database transaction.
- Prevents simultaneous verification requests from losing or duplicating time.

### Paid-amount validation

For standalone QuickPost purchases, verification no longer trusts the interval
stored in Razorpay notes. It derives the purchased duration from the confirmed
fully paid amount and rejects unknown, partial, or inconsistent amounts.

Supported checkout durations are now validated as exactly:

- 1 month
- 3 months
- 6 months
- 12 months
