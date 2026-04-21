# Auto-Posting Scheduling System — Advanced System Design & Implementation Spec

## Purpose
This document defines a production-grade scheduling system for an auto-posting platform where users can:
- create a post,
- choose one or more connected social platforms,
- set a future date and time,
- save the post,
- close the website/app,
- and still have the post automatically published at the scheduled time.

This spec is written so an implementation agent or developer can directly understand the feature, architecture, responsibilities, data flow, failure handling, and rollout plan.

---

# 1. Problem Statement

The platform already supports immediate posting to connected platforms.

Now we need to add **scheduled posting** so that:
- users can schedule posts for a future date/time,
- the scheduled post must execute even when the user is offline,
- execution must be reliable,
- duplicate posting must be prevented,
- failures must be trackable and retryable,
- the system must scale as the number of scheduled posts increases.

---

# 2. Core Requirement

A scheduled post must **not depend on the user's browser session**.

That means:
- the frontend only collects scheduling input,
- the backend stores the schedule,
- a background scheduler/queue/worker system executes the post later,
- the worker talks to platform APIs,
- the platform result is stored back in the database.

---

# 3. High-Level Architecture

```text
User UI
  ↓
API Server
  ↓
Database (posts, schedules, logs, platform accounts)
  ↓
Queue / Scheduler
  ↓
Background Worker(s)
  ↓
Social Platform APIs
  ↓
Status Updates / Logs / Notifications
```

## Recommended Production Stack

### Preferred
- **Frontend**: existing app UI
- **Backend API**: Node.js / Express / Next.js API routes
- **Database**: PostgreSQL / Supabase Postgres
- **Queue**: Redis + BullMQ
- **Workers**: Node background workers
- **Scheduler trigger**: BullMQ delayed jobs OR cron-based poller as backup
- **Storage**: Supabase Storage / S3 for media
- **Auth**: existing auth system

### Why this stack
- reliable delayed jobs,
- retries,
- concurrency control,
- visibility into job state,
- scalable workers,
- industry-standard pattern for async execution.

---

# 4. Non-Goals

This feature does not initially require:
- AI caption generation,
- platform analytics dashboard,
- content approval workflows,
- team collaboration permissions,
- recurring post series.

These can be added later.

---

# 5. Functional Requirements

## 5.1 User-facing capabilities
Users should be able to:
1. create a post with caption/media,
2. select one or more connected platforms,
3. choose **Post Now** or **Schedule for Later**,
4. select date, time, and timezone,
5. save the scheduled post,
6. view all scheduled posts,
7. edit a scheduled post before execution,
8. cancel a scheduled post,
9. see final status: posted / failed / partially posted,
10. see per-platform result details.

## 5.2 System-facing capabilities
The system should:
1. execute posts at or near the scheduled time,
2. support background execution without user presence,
3. retry transient failures,
4. avoid duplicate posting,
5. safely handle server restarts,
6. log all attempts,
7. support scale across many jobs,
8. track each platform separately for multi-platform posts.

---

# 6. Key Technical Principles

## 6.1 Persist first, execute later
Never rely on frontend timers.
All scheduling data must be saved in the database first.

## 6.2 Idempotency
A post must not be published twice due to:
- retry,
- worker restart,
- duplicate job execution,
- race condition,
- API timeout after publish.

## 6.3 Per-platform tracking
One logical post may target multiple platforms.
Execution status should be stored per platform, not only at the parent post level.

## 6.4 UTC storage
Store all scheduled execution timestamps in UTC.
Keep the user's original timezone for display and editing.

## 6.5 Observable system
All queue events, worker attempts, failures, and API responses should be logged enough for debugging.

---

# 7. Data Model

## 7.1 posts table
Represents the user-created content entity.

```sql
create table posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  content text,
  media_payload jsonb,
  post_type text not null default 'standard',
  publish_mode text not null check (publish_mode in ('instant', 'scheduled')),
  overall_status text not null check (
    overall_status in (
      'draft',
      'scheduled',
      'queued',
      'processing',
      'partially_posted',
      'posted',
      'failed',
      'cancelled'
    )
  ),
  scheduled_at_utc timestamptz,
  user_timezone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

## 7.2 post_targets table
One row per target platform/account.

```sql
create table post_targets (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  platform text not null,
  platform_account_id uuid not null,
  target_status text not null check (
    target_status in (
      'scheduled',
      'queued',
      'processing',
      'posted',
      'failed',
      'cancelled'
    )
  ),
  scheduled_at_utc timestamptz not null,
  external_post_id text,
  last_error text,
  attempts int not null default 0,
  posted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

## 7.3 scheduled_jobs table
Optional but recommended for visibility and recovery.
This stores the relationship between app-level scheduled actions and queue jobs.

```sql
create table scheduled_jobs (
  id uuid primary key default gen_random_uuid(),
  post_target_id uuid not null references post_targets(id) on delete cascade,
  queue_job_id text,
  job_type text not null default 'publish_post',
  job_status text not null check (
    job_status in (
      'pending',
      'queued',
      'active',
      'completed',
      'failed',
      'cancelled'
    )
  ),
  run_at_utc timestamptz not null,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

## 7.4 platform_connections table
Represents user connected accounts/tokens.

```sql
create table platform_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  platform text not null,
  account_label text,
  access_token text not null,
  refresh_token text,
  token_expires_at timestamptz,
  metadata jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

## 7.5 post_attempt_logs table
Stores detailed execution logs.

```sql
create table post_attempt_logs (
  id uuid primary key default gen_random_uuid(),
  post_target_id uuid not null references post_targets(id) on delete cascade,
  attempt_number int not null,
  worker_id text,
  request_payload jsonb,
  response_payload jsonb,
  result text not null check (result in ('success', 'failure')),
  error_message text,
  created_at timestamptz not null default now()
);
```

---

# 8. Status Model

## Parent post overall_status
- `draft`
- `scheduled`
- `queued`
- `processing`
- `partially_posted`
- `posted`
- `failed`
- `cancelled`

## Per-target target_status
- `scheduled`
- `queued`
- `processing`
- `posted`
- `failed`
- `cancelled`

## Rules
- If all targets are posted → parent `posted`
- If some posted and some failed → parent `partially_posted`
- If all failed → parent `failed`
- If cancelled before run → target `cancelled`, parent may become `cancelled`

---

# 9. Scheduling Flow

## 9.1 Create Scheduled Post

### Frontend sends:
- content
- media references
- selected platforms/accounts
- scheduled date/time
- user timezone

### Backend actions:
1. validate payload,
2. convert scheduled local time to UTC,
3. create `posts` row with `overall_status = scheduled`,
4. create one `post_targets` row per platform/account,
5. create corresponding queue jobs,
6. store queue job metadata in `scheduled_jobs`,
7. return success to frontend.

---

# 10. Queue Design

## Recommended: one job per target platform
This is better than one giant multi-platform job because:
- retries can happen per platform,
- failures remain isolated,
- observability is cleaner,
- rate limits are easier to handle.

### Example
If a post is scheduled for Instagram + LinkedIn + Facebook, create 3 delayed jobs.

---

# 11. BullMQ Job Shape

```json
{
  "jobType": "publish_post_target",
  "postId": "...",
  "postTargetId": "...",
  "userId": "...",
  "platform": "linkedin",
  "platformAccountId": "...",
  "scheduledAtUtc": "2026-04-25T10:30:00.000Z"
}
```

## BullMQ options
```js
{
  delay: runAtMs - Date.now(),
  attempts: 5,
  backoff: {
    type: 'exponential',
    delay: 30000
  },
  removeOnComplete: false,
  removeOnFail: false,
  jobId: `publish:${postTargetId}`
}
```

### Important
Use deterministic `jobId` so duplicate queue insertion is prevented.

---

# 12. Worker Execution Flow

When a delayed job becomes active:

1. fetch `post_target` and parent `post`,
2. verify status is still eligible (`scheduled` or `queued`),
3. acquire lock / ensure single execution,
4. mark `post_target = processing`,
5. refresh platform token if needed,
6. prepare platform-specific payload,
7. call the platform API,
8. store response,
9. mark target as `posted` or `failed`,
10. update parent aggregate status,
11. write attempt log.

---

# 13. Idempotency Strategy

This is one of the most important parts.

## Risks
A worker may:
- send API request,
- platform may publish successfully,
- network timeout happens before response,
- worker retries,
- duplicate post may occur.

## Mitigation
1. Use one `post_target` row per publish target.
2. Before posting, check if `target_status = posted`; if yes, exit.
3. Use `jobId = publish:${postTargetId}` in queue.
4. Maintain `external_post_id` after success.
5. Where supported, send platform-side idempotency keys.
6. Wrap state transition in transaction / row-level lock.

## Suggested execution lock query
```sql
select * from post_targets
where id = $1
for update;
```

This prevents concurrent workers from processing the same row.

---

# 14. Retry Strategy

## Retry only transient failures
Retry for:
- 429 rate limit,
- 5xx platform errors,
- temporary network issues,
- token refresh race issues that can recover.

Do not retry for:
- invalid media format,
- disconnected account,
- revoked permissions,
- unsupported post type,
- permanent validation errors.

## Retry config
- attempts: 5
- exponential backoff
- optional jitter for thundering herd prevention

Example retry schedule:
- 30 sec
- 1 min
- 2 min
- 4 min
- 8 min

---

# 15. Token Management

Scheduled posting means tokens may expire between scheduling and posting time.

## Requirements
Before publish:
1. load platform connection,
2. check token expiry,
3. refresh token if refresh flow exists,
4. store new token securely,
5. continue publishing.

## If token refresh fails
- mark target failed,
- return meaningful error like `REAUTH_REQUIRED`,
- notify user to reconnect account.

---

# 16. Timezone Handling

## Frontend
- user selects local date/time,
- timezone is captured explicitly,
- UI should show timezone next to picker.

## Backend
- convert local input to UTC before storage,
- persist both:
  - `scheduled_at_utc`
  - `user_timezone`

## Example
User selects:
- Date: 2026-04-25
- Time: 04:00 PM
- Timezone: Asia/Kolkata

Store:
- `scheduled_at_utc = 2026-04-25T10:30:00Z`
- `user_timezone = Asia/Kolkata`

## Rule
All job execution is based on UTC.
All UI rendering is based on user timezone.

---

# 17. Editing a Scheduled Post

Users should be able to edit a scheduled post **only before execution starts**.

## Allowed fields
- content
- media
- scheduled time
- target platforms (careful)

## Backend process
1. verify parent/targets are not already processing/posted,
2. update DB rows,
3. cancel old queue jobs,
4. create new delayed jobs if schedule changed,
5. write audit log.

---

# 18. Cancelling a Scheduled Post

## User action
Clicks cancel on a scheduled post.

## Backend actions
1. mark parent and targets as `cancelled` if not already posted,
2. remove pending delayed jobs from queue,
3. if a target is already processing, cancellation may not be guaranteed.

## UI note
Show clear state:
- Cancelled successfully
- Some targets already posted / in progress

---

# 19. Failure Categories

Define structured error categories instead of plain text only.

Suggested codes:
- `TOKEN_EXPIRED`
- `REAUTH_REQUIRED`
- `RATE_LIMITED`
- `NETWORK_ERROR`
- `INVALID_MEDIA`
- `INVALID_CAPTION`
- `ACCOUNT_DISCONNECTED`
- `PLATFORM_API_ERROR`
- `UNSUPPORTED_COMBINATION`
- `UNKNOWN_ERROR`

Store both:
- machine-readable code,
- human-readable message.

---

# 20. Notification Strategy

When a scheduled job completes or fails, the user should be informed.

## Minimum
- in-app notification
- status visible on scheduled posts page

## Optional later
- email notification
- webhook notification
- mobile push notification

## Trigger events
- post successfully published
- partial success
- failed after all retries
- reconnect required

---

# 21. API Endpoints

## Create scheduled post
`POST /api/posts/schedule`

Request:
```json
{
  "content": "Launching new feature today",
  "mediaPayload": [],
  "targets": [
    { "platform": "linkedin", "platformAccountId": "uuid-1" },
    { "platform": "facebook", "platformAccountId": "uuid-2" }
  ],
  "scheduledLocalDateTime": "2026-04-25T16:00:00",
  "userTimezone": "Asia/Kolkata"
}
```

## Get scheduled posts
`GET /api/posts?status=scheduled`

## Edit scheduled post
`PATCH /api/posts/:postId`

## Cancel scheduled post
`POST /api/posts/:postId/cancel`

## Retry failed target manually
`POST /api/post-targets/:postTargetId/retry`

---

# 22. Execution Logic Pseudocode

## Schedule creation
```js
async function schedulePost(payload, user) {
  const scheduledAtUtc = convertLocalToUtc(
    payload.scheduledLocalDateTime,
    payload.userTimezone
  );

  return db.transaction(async (tx) => {
    const post = await tx.posts.insert({
      user_id: user.id,
      content: payload.content,
      media_payload: payload.mediaPayload,
      publish_mode: 'scheduled',
      overall_status: 'scheduled',
      scheduled_at_utc: scheduledAtUtc,
      user_timezone: payload.userTimezone,
    });

    for (const target of payload.targets) {
      const postTarget = await tx.postTargets.insert({
        post_id: post.id,
        platform: target.platform,
        platform_account_id: target.platformAccountId,
        target_status: 'scheduled',
        scheduled_at_utc: scheduledAtUtc,
      });

      const job = await queue.add(
        'publish_post_target',
        {
          postId: post.id,
          postTargetId: postTarget.id,
          userId: user.id,
          platform: target.platform,
          platformAccountId: target.platformAccountId,
          scheduledAtUtc,
        },
        {
          delay: new Date(scheduledAtUtc).getTime() - Date.now(),
          attempts: 5,
          backoff: { type: 'exponential', delay: 30000 },
          jobId: `publish:${postTarget.id}`,
          removeOnComplete: false,
          removeOnFail: false,
        }
      );

      await tx.scheduledJobs.insert({
        post_target_id: postTarget.id,
        queue_job_id: job.id,
        job_status: 'queued',
        run_at_utc: scheduledAtUtc,
      });
    }

    return post;
  });
}
```

## Worker
```js
worker.process('publish_post_target', async (job) => {
  const { postTargetId } = job.data;

  return db.transaction(async (tx) => {
    const target = await tx.postTargets.lockForUpdate(postTargetId);
    if (!target) throw new Error('Target not found');

    if (target.target_status === 'posted' || target.target_status === 'cancelled') {
      return;
    }

    await tx.postTargets.update(postTargetId, {
      target_status: 'processing',
      attempts: target.attempts + 1,
    });

    const post = await tx.posts.findById(target.post_id);
    const connection = await tx.platformConnections.findById(target.platform_account_id);

    const validConnection = await ensureFreshToken(connection);

    const result = await publishToPlatform({
      platform: target.platform,
      connection: validConnection,
      content: post.content,
      mediaPayload: post.media_payload,
      idempotencyKey: `post-target:${target.id}`,
    });

    await tx.postAttemptLogs.insert({
      post_target_id: target.id,
      attempt_number: target.attempts + 1,
      worker_id: process.env.WORKER_ID || 'worker-1',
      request_payload: { platform: target.platform },
      response_payload: result,
      result: 'success',
    });

    await tx.postTargets.update(target.id, {
      target_status: 'posted',
      external_post_id: result.externalPostId,
      posted_at: new Date().toISOString(),
      last_error: null,
    });

    await recomputeParentPostStatus(tx, post.id);
  });
});
```

---

# 23. Cron-Based Recovery Poller (Recommended Backup)

Even if BullMQ delayed jobs are used, add a lightweight recovery poller.

## Why
If a queue entry is lost, delayed job registration fails, or a deployment issue occurs, the system still needs recovery.

## Backup process
Every 1 minute:
```sql
select * from post_targets
where target_status in ('scheduled', 'queued')
and scheduled_at_utc <= now();
```

For any missing/inactive jobs:
- re-enqueue safely using deterministic job ID.

This gives resilience.

---

# 24. Concurrency and Scaling

## Worker scaling
Multiple workers can run in parallel.
Use:
- queue concurrency per worker,
- platform-specific rate limits,
- row locks to avoid double execution.

## Suggested strategy
- global worker pool,
- optional separate queues by platform if scale grows,
- throttle per platform.

### Example future split
- `queue:publish:linkedin`
- `queue:publish:facebook`
- `queue:publish:instagram`

This makes rate-limit control easier.

---

# 25. Observability

Must-have monitoring:
- total scheduled jobs,
- jobs due in next hour,
- success rate,
- failure rate,
- retry count,
- average delay from scheduled time to actual publish time,
- per-platform error breakdown.

## Logging
Log structured data for:
- schedule creation,
- queue enqueue,
- worker start,
- API request metadata,
- API response summary,
- retry reason,
- final state.

## Alerts
Trigger alerts when:
- queue backlog too high,
- worker crashes repeatedly,
- publish failure rate spikes,
- token refresh failures spike.

---

# 26. Security Requirements

- encrypt or securely store platform tokens,
- never expose access tokens to frontend unnecessarily,
- validate account ownership before scheduling,
- verify user can only schedule to their own connected accounts,
- sanitize captions and metadata before logs if needed,
- restrict admin/debug access to job payloads.

---

# 27. UX Requirements

## Composer UI
- platform selector
- caption editor
- media uploader
- `Post now` vs `Schedule`
- date picker
- time picker
- timezone label
- validation messages

## Scheduled posts page
- upcoming posts list
- grouped by date
- edit action
- cancel action
- retry failed action
- per-platform status chips
- final result logs/details

## Nice-to-have later
- calendar view
- drag-and-drop rescheduling
- preview per platform

---

# 28. Validation Rules

## Backend validation
- scheduled time must be in the future,
- at least one platform target required,
- connected account must belong to the user,
- media requirements must match selected platform,
- platform tokens must exist at schedule creation time,
- disallow editing after job has started processing.

---

# 29. Edge Cases

1. User schedules post in the past  
   - reject request

2. User disconnects account before scheduled time  
   - fail target gracefully and notify

3. Media deleted before scheduled time  
   - fail target with `INVALID_MEDIA`

4. Queue service restarts  
   - delayed jobs should recover, backup poller verifies

5. Worker crashes mid-publish  
   - row-level lock + retry + idempotency protects system

6. One platform succeeds, another fails  
   - parent becomes `partially_posted`

7. User edits while worker is starting  
   - use transactional state checks

8. Platform API returns timeout after actual publish  
   - treat carefully, use idempotency / platform lookup if possible

---

# 30. Rollout Plan

## Phase 1 — Core MVP
- schedule UI
- DB schema
- delayed queue jobs
- background workers
- per-target posting
- status updates
- basic retry

## Phase 2 — Reliability
- idempotency hardening
- backup poller
- attempt logs
- notifications
- edit/cancel support

## Phase 3 — Scale & Ops
- dashboards
- platform-specific queues
- advanced rate-limit handling
- alerting
- manual replay tools

---

# 31. Engineering Task Breakdown

## Backend
- [ ] create DB migrations for `posts`, `post_targets`, `scheduled_jobs`, `post_attempt_logs`
- [ ] update existing post creation API to support `publish_mode = scheduled`
- [ ] implement UTC timezone conversion utility
- [ ] implement queue setup using BullMQ + Redis
- [ ] implement job enqueue logic
- [ ] implement worker processor per target platform
- [ ] implement platform token refresh handling
- [ ] implement retry policy
- [ ] implement parent status recomputation
- [ ] implement cancel scheduled post endpoint
- [ ] implement edit scheduled post endpoint
- [ ] implement manual retry endpoint for failed target
- [ ] implement cron recovery poller
- [ ] add structured logs

## Frontend
- [ ] add `Post now / Schedule` toggle
- [ ] add date picker and time picker
- [ ] display user's timezone clearly
- [ ] add schedule validation UI
- [ ] add scheduled posts listing page
- [ ] add edit/cancel actions
- [ ] add per-platform status display
- [ ] add posted/failed notifications

## DevOps
- [ ] deploy Redis
- [ ] deploy worker process separately from main app
- [ ] configure worker autoscaling if needed
- [ ] configure env vars for queue and platform tokens
- [ ] add monitoring and alerting

---

# 32. Suggested Folder Structure

```text
/src
  /api
    schedulePost.ts
    updateScheduledPost.ts
    cancelScheduledPost.ts
  /queue
    index.ts
    enqueuePublishJob.ts
    queues.ts
  /workers
    publishWorker.ts
  /services
    publishToPlatform.ts
    refreshPlatformToken.ts
    recomputeParentPostStatus.ts
  /db
    queries/
    migrations/
  /utils
    timezone.ts
    idempotency.ts
    logger.ts
```

---

# 33. Recommended Final Architecture Decision

## Best choice for this project
Use:
- **Postgres/Supabase** for persistent post and state data,
- **Redis + BullMQ** for delayed scheduled jobs,
- **Dedicated worker service** for background execution,
- **One job per platform target**,
- **UTC timestamps + stored user timezone**,
- **row-level locking + deterministic job IDs** for idempotency,
- **backup cron poller** for resilience.

This is scalable, clean, production-ready, and fits an auto-posting SaaS well.

---

# 34. Minimum Acceptance Criteria

The feature is complete when:
1. a user can schedule a future post,
2. the user can close the site,
3. the post still publishes automatically at scheduled time,
4. multi-platform posting works independently per platform,
5. duplicate publishing is prevented,
6. failures are logged,
7. retry behavior works,
8. scheduled posts can be viewed and cancelled before execution.

---

# 35. Notes for the Implementation Agent

## Build order recommendation
1. DB schema
2. queue setup
3. schedule creation API
4. worker execution
5. status tracking
6. UI schedule flow
7. edit/cancel
8. recovery poller
9. monitoring/logging

## Important implementation warning
Do **not** implement scheduling using:
- frontend `setTimeout`,
- browser background tabs,
- client-only timers,
- in-memory server arrays.

Those approaches will fail when the user closes the app or when the server restarts.

Use persistent DB state + queue + workers only.

---

# 36. Optional Future Enhancements

- recurring schedules
- approval workflows
- queue priorities
- AI-generated best-post-time suggestions
- bulk schedule upload
- post simulation / dry-run validator
- platform-specific preview rendering
- webhook callbacks for enterprise users

---

# Final Summary

This feature should be built as a **background scheduled job system**, not a frontend timer feature.

The correct production architecture is:
- save scheduled post in DB,
- enqueue delayed background jobs,
- run worker(s) independently of user sessions,
- publish per platform target,
- track statuses and logs,
- protect against duplicates with idempotency,
- recover safely with retry and backup poller.

This gives a stable, scalable, industry-level scheduled auto-posting system.
