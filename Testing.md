# QuickPost Testing

## Automated local tests

From the QuickPost root:

```powershell
npm.cmd install
npm.cmd test
npm.cmd run test:coverage
```

The Vitest suite covers plan definitions, subscription validity, quota periods,
watermark policy, queue limits, entitlement middleware, and schema consistency.
The HTML coverage report is generated at `coverage/index.html`.

## Staging Supabase setup

Use only the dedicated staging project. Link and preview migrations:

```powershell
npx.cmd supabase link --project-ref ckddwgloycvnrvtejdag
$env:SUPABASE_DB_PASSWORD = Read-Host "Staging database password" -MaskInput
npx.cmd supabase db push --dry-run --include-all
```

If the dry run lists the expected migrations without errors, apply them:

```powershell
npx.cmd supabase db push --include-all
Remove-Item Env:SUPABASE_DB_PASSWORD
```

## Auto-DM quota boundary test

The SQL below is configured for the staging user
`ccdd1d7f-c831-44fa-b9e9-722199a5d304`:

```sql
insert into public.app_subscriptions (
  user_id,
  plan_id,
  source,
  status,
  current_period_start,
  current_period_end
)
values (
  'ccdd1d7f-c831-44fa-b9e9-722199a5d304',
  'free',
  'standalone',
  'active',
  date_trunc('month', now()),
  date_trunc('month', now()) + interval '1 month'
)
on conflict (user_id, source)
do update set
  plan_id = excluded.plan_id,
  status = excluded.status,
  current_period_start = excluded.current_period_start,
  current_period_end = excluded.current_period_end;

insert into public.entitlement_usage (
  user_id,
  metric,
  used,
  period_start,
  period_end
)
values (
  'ccdd1d7f-c831-44fa-b9e9-722199a5d304',
  'autodm_replies_per_month',
  49,
  date_trunc('month', now())::date,
  (date_trunc('month', now()) + interval '1 month - 1 day')::date
)
on conflict (user_id, metric, period_start)
do update set
  used = excluded.used,
  period_end = excluded.period_end;

select *
from public.consume_entitlement_usage(
  'ccdd1d7f-c831-44fa-b9e9-722199a5d304',
  'autodm_replies_per_month',
  1,
  50,
  date_trunc('month', now())::date,
  (date_trunc('month', now()) + interval '1 month - 1 day')::date
);

select *
from public.consume_entitlement_usage(
  'ccdd1d7f-c831-44fa-b9e9-722199a5d304',
  'autodm_replies_per_month',
  1,
  50,
  date_trunc('month', now())::date,
  (date_trunc('month', now()) + interval '1 month - 1 day')::date
);
```

Expected results:

- First call: `allowed = true`, `used = 50`.
- Second call: `allowed = false`, `used = 50`.

Then deploy the staging webhook and perform one real Instagram test. A Free user
must receive the SocialPilot watermark; Pro and Enterprise users must not.

## Remaining boundary tests

| Feature | Seed before test | Expected |
|---|---:|---|
| Free contacts | 99/100 | One accepted, next blocked |
| Free automations | 0/1 | First accepted, second blocked |
| Free Instagram accounts | 2/3 | Third accepted, fourth blocked |
| Free scheduled queue | 9/10 per channel | Tenth accepted, next blocked |
| Pro Instagram accounts | 9/10 | Tenth accepted, next blocked |
| Enterprise Instagram accounts | 29/30 | Thirtieth accepted, next blocked |
| Free history | Records at 6 and 8 days | Only 6-day record returned |

## External checks

Vitest cannot prove live Meta delivery, OAuth callbacks, Razorpay callbacks,
Supabase RLS, or concurrent remote database behavior. Test those only against
staging accounts. Never run destructive boundary tests against production.
