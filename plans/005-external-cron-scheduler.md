# Plan 005 — Make the backoff schedule real with a free external cron scheduler

Priority: P1 · Effort: S · Depends on: none · Status: TODO

## Executor protocol (read first)

1. Read `resend-challenge-progress.md` before starting; append a session entry when
   done (what was done, verified vs unverified, gotchas).
2. Verification bar before commit: `pnpm test && pnpm lint && pnpm build` all green.
3. Global code style: max 250 lines/file, no comments, no magic numbers (named
   constants), no `any`, `import type` for types, descriptive names.
4. Hard constraint from Andrei: **no paid Vercel plan**. Do not propose or configure
   Vercel Pro per-minute cron. The Hobby daily cron stays as-is in `vercel.json`.

## Problem

`runCheck` (src/lib/domains/checks.ts:114) writes `next_check_at` via
`computeNextCheckAt` (src/lib/domains/schedule.ts): 60s · 1.15ⁿ capped at 4h for
pending/grace domains, +24h for verified. The only consumer of that column when no
browser tab is open is `GET /api/cron/revalidate`
(src/app/api/cron/revalidate/route.ts) → `sweepDueDomains`
(src/lib/domains/service.ts:201), and Vercel Hobby cron fires it **once a day**
(`vercel.json`: `0 6 * * *`, ±59min accuracy). Consequences:

- A user who adds a domain, closes the tab, and fixes DNS an hour later is not
  verified until the next daily sweep.
- A verified domain whose record disappears may burn up to a day of its 72h grace
  window before the warning email sends.

The fix costs nothing: the cron route is a plain HTTPS endpoint authenticated by
`Authorization: Bearer ${CRON_SECRET}`. Any free external scheduler can call it
every few minutes. Chosen: **cron-job.org** (free, per-minute capable, custom
headers, failure notifications). Fallback alternative: Upstash QStash free
schedule (1,000 msgs/day allows one call every 2 min; forwards headers via
`Upstash-Forward-Authorization`).

## Design decisions

1. **Ping interval: every 5 minutes** (`*/5`). Not faster, for two reasons:
   the sweep's internal deadline is 250s (`SWEEP_DEADLINE_MS`,
   src/lib/domains/service.ts:33), so 5-minute spacing guarantees two sweeps
   never overlap even in the worst case; and 5-minute max staleness is already a
   ~300× improvement over daily. Do NOT lower the interval below 5 minutes
   without also shipping the claim-lease below.
2. **Respond fast, work in the background.** cron-job.org free times out requests
   at 30s; our sweep can legitimately run 250s. Restructure the route to start
   the sweep via `after()` from `next/server` (the codebase already uses this
   pattern in `createDomain` and `getDomainDetail`) and immediately return
   `202 {started: true}`. The external scheduler then measures "did the endpoint
   accept," which is the correct semantic for a trigger. Sweep outcomes go to
   `console.log` (visible in Vercel logs). Vercel Fluid keeps the function alive
   for `after()` work up to `maxDuration` (already `300` on this route).
3. **Concurrent-sweep safety via row claim (cheap insurance).** Two triggers can
   still coincide (daily Vercel cron + external ping, or a manually-run curl).
   Make domain selection atomic: instead of SELECT-then-check, claim due rows by
   bumping `next_check_at` forward with an UPDATE … RETURNING, then only process
   the rows the UPDATE returned. A concurrent sweep's UPDATE cannot claim the
   same rows because the first UPDATE already moved `next_check_at` past `now`.
   If a claimed check crashes before `runCheck` completes, the domain simply
   becomes due again after the lease window — self-healing, no cleanup needed.
4. **Keep the daily Vercel cron** in `vercel.json` unchanged. It becomes a free
   backstop if the external service lapses. Its sweep is now also idempotent per
   decision 3.

## Implementation steps

### Step 1 — claim-based sweep in `src/lib/domains/service.ts`

Current shape (service.ts:201–222): SELECT due domains (limit 25) → chunked
`runCheck` loop. Change the selection to a claiming UPDATE:

```ts
const CLAIM_LEASE_MS = 5 * 60 * 1000

const claimDueDomains = async (now: Date): Promise<DomainRow[]> => {
  const due = db.$with('due', ...) // see note below
  ...
}
```

Concrete Drizzle approach (verify exact API against Drizzle 0.45 docs via
Context7 before writing — `resolve-library-id` → `query-docs` for
"update with subquery limit returning"): Postgres cannot LIMIT an UPDATE
directly, so use the standard claim pattern:

```sql
UPDATE domains SET next_check_at = now() + interval '5 minutes'
WHERE id IN (
  SELECT id FROM domains
  WHERE next_check_at <= now() AND status IN ('pending','verified','temporary_failure')
  ORDER BY next_check_at ASC
  LIMIT 25
  FOR UPDATE SKIP LOCKED
)
RETURNING *;
```

Notes for the executor:
- The Neon HTTP driver has no interactive transactions, but a single UPDATE with
  a subquery is one statement — atomic on its own. `FOR UPDATE SKIP LOCKED`
  inside the subquery is desirable but optional in a single statement; if
  Drizzle 0.45 cannot express it cleanly, drop `FOR UPDATE SKIP LOCKED` — the
  claim UPDATE alone already prevents double-processing across sweeps (worst
  case two *simultaneous* statements serialize on row locks and the second
  claims nothing).
- If Drizzle's query builder cannot express `UPDATE … WHERE id IN (subquery
  with ORDER BY/LIMIT) RETURNING`, use `db.execute(sql\`…\`)` with the `sql`
  template — typed row mapping via `domains` table columns. Keep it in
  `service.ts`; extract a `claimDueDomains(now)` helper above `sweepDueDomains`.
- `CLAIM_LEASE_MS` is a named constant next to the other module constants
  (service.ts:30–34). The lease value intentionally equals the ping interval.
- `runCheck` recomputes and overwrites `next_check_at` when the check finishes
  (checks.ts:114), so the lease bump is transient and never visible to users.
- `sweepDueDomains` keeps its existing chunking (`CRON_CONCURRENCY` 5), deadline
  (`SWEEP_DEADLINE_MS`), and `SweepResult` shape `{checked, failed, remaining}`;
  `remaining` now means "claimed but not processed before deadline" — those rows
  become due again after the lease expires, which is correct behavior. Mention
  this in the progress note.

### Step 2 — fast-ack cron route in `src/app/api/cron/revalidate/route.ts`

Current: awaits `sweepDueDomains`, returns its JSON. Change to:

```ts
import { after, NextResponse } from 'next/server'  // after comes from 'next/server'

const HTTP_ACCEPTED = 202

export const GET = async (request: Request) => {
  const authorizationHeader = request.headers.get('authorization')
  if (authorizationHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return errorResponse(HTTP_UNAUTHORIZED, 'unauthorized', 'Unauthorized')
  }
  after(async () => {
    const sweep = await sweepDueDomains(new Date())
    console.log('cron sweep', sweep)
  })
  return NextResponse.json({ started: true }, { status: HTTP_ACCEPTED })
}
```

- Keep `export const maxDuration = 300`.
- `after` must be imported from `next/server` (same import the service already
  uses). Consult `node_modules/next/dist/docs/` for this Next version's `after`
  semantics before writing (per repo AGENTS.md); confirm it is callable from a
  route handler and runs post-response.
- Swallow/log sweep errors inside the `after` callback
  (`.catch` + `console.error`) so an unhandled rejection can't crash the
  function between requests.

### Step 3 — tests

- `src/lib/domains/schedule.test.ts` and existing service-adjacent tests don't
  cover the sweep; add what is testable without a DB:
  - If `claimDueDomains` ends up as raw SQL, extract any pure logic (none
    expected) — otherwise skip unit tests for the SQL and rely on manual
    verification below. Do NOT build a DB test harness for this plan.
- Type-check the new route return shape.

### Step 4 — manual verification (document results in the progress file)

1. Local: `curl -i -H "Authorization: Bearer $CRON_SECRET" localhost:3000/api/cron/revalidate`
   → expect `202 {"started":true}` immediately; server console shows
   `cron sweep { checked: …, failed: …, remaining: … }` shortly after.
2. Wrong/missing bearer → `401`.
3. Two rapid back-to-back curls → second sweep claims zero rows (log shows
   `checked: 0`) while the first is mid-flight, proving the claim works.
4. Prod after deploy: same curl against the production URL.

### Step 5 — external scheduler setup (Andrei or executor with account access)

cron-job.org (primary):
1. Create free account → Create cronjob.
2. URL: `https://<prod-domain>/api/cron/revalidate`.
3. Schedule: every 5 minutes.
4. Advanced → Headers: `Authorization: Bearer <CRON_SECRET value from Vercel env>`.
5. Enable failure notifications (email on non-2xx).
6. Save, run once manually, confirm 202 in the job history and a sweep line in
   Vercel logs.

QStash alternative (if cron-job.org is unacceptable): Upstash console → QStash →
Schedules → cron `*/5 * * * *`, destination the same URL, header forwarding via
`Upstash-Forward-Authorization: Bearer <CRON_SECRET>`. Free tier 1,000 msgs/day;
288/day used. Do not add the QStash SDK for this — it's a plain HTTP schedule.

### Step 6 — docs touch-ups owned by this plan

- README line 56 ("daily cron sweep with capped-exponential backoff") and the
  cron row in the endpoint table (line ~122, currently documents
  `200 {checkedDomains}`): update to the 202 fast-ack shape and "sweep every
  5 minutes via an external scheduler, with the platform daily cron as backstop".
  (Plan 006 rewrites the surrounding sections; if 006 lands first, it will have
  left these two spots alone — coordinate via the plans README status column.)
- `src/app/(docs)/docs/page.tsx:68` "we keep re-checking daily" → "we keep
  re-checking automatically" (exact copy at executor's discretion; keep the
  Text/Heading typography components, never raw text classes).

## STOP conditions

- STOP if `after()` from `next/server` is unavailable or behaves differently in
  this Next 16 build (check bundled docs) — fall back to keeping the route
  synchronous and REQUIRE the QStash alternative (its timeout tolerance is
  higher than cron-job.org's 30s), noting the change in the progress file.
- STOP if the claim UPDATE cannot be expressed against the Neon HTTP driver in a
  single statement — do not ship SELECT-then-UPDATE-per-row as a substitute
  without flagging the race in the progress file.
- Never commit `CRON_SECRET` or paste its value into any file.

## Out of scope

- Vercel Pro cron, Vercel Queues, per-domain QStash `Not-Before` scheduling,
  durable workflows (documented in `resend-challenge-scale-research.md` §3.3 as
  the paid-scale ladder).
- Webhooks (plan 009), backoff reset on manual verify (plan 007).
