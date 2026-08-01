# Plan 003: Bound the cron sweep (concurrency, deadline, failure isolation, visible truncation)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: This plan was written against commit `4ce0032`
> **plus uncommitted working-tree changes** — all "Current state" excerpts were
> taken from the live working tree on 2026-08-01. Do not rely on `git diff`
> against the SHA; open each cited file and compare it to the excerpts. On a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW-MED
- **Depends on**: plans/001-verification-baseline.md (green lint gate)
- **Category**: bug
- **Planned at**: commit `4ce0032` (+ uncommitted working tree), 2026-08-01

## Why this matters

The daily cron sweep runs up to 25 domain checks **serially**, and one check
worst-cases around 30 seconds (NS resolution up to 10s, then
authoritative+DoH lookups up to 10s, then a misplaced-record lookup up to 10s
— timeouts in `src/lib/dns/constants.ts:4-8`). 25 × 30s ≈ 750s exceeds the
function execution ceiling, so on a bad DNS day the function is killed
mid-sweep: domains at the tail of the batch are silently never checked, and
because the cron is daily (a recorded decision — see below), each miss is a
full day of status drift. A single thrown check also aborts every remaining
domain in the batch. This plan parallelizes with a small concurrency cap,
adds a deadline so the sweep exits cleanly before the platform kills it,
isolates per-domain failures, and reports what was skipped.

**Decision constraint (do not violate)**: `DECISIONS.md` §10 records that
scheduling is check-on-read + client polling + a **daily Vercel cron**, with
job queues (Inngest/QStash) explicitly rejected at this scale. This plan
changes only how one cron invocation executes internally — do not introduce a
queue, change the schedule, or split the cron into multiple crons.

## Current state

Next.js 16.2.11 App Router + TypeScript strict, pnpm, Vitest, Drizzle ORM on
the Neon **HTTP** driver (each query is an independent HTTPS request — no
shared connection to saturate, but concurrent queries multiply simultaneous
requests). Repo conventions: no code comments; no magic numbers (named
constants); no `any`; `import type` for type-only imports.

Relevant files:

- `src/lib/domains/service.ts:193-206` — the sweep (constants at line 29:
  `const CRON_BATCH_SIZE = 25`):

  ```ts
  export const sweepDueDomains = async (now: Date): Promise<number> => {
    const dueDomains = await db
      .select()
      .from(domains)
      .where(
        and(lte(domains.nextCheckAt, now), inArray(domains.status, [...CHECKABLE_STATUSES])),
      )
      .orderBy(asc(domains.nextCheckAt))
      .limit(CRON_BATCH_SIZE)
    for (const domain of dueDomains) {
      await runCheck(domain, 'cron')
    }
    return dueDomains.length
  }
  ```

- `src/app/api/cron/revalidate/route.ts` — full current content:

  ```ts
  import { NextResponse } from 'next/server'
  import { errorResponse } from '@/lib/http/responses'
  import { sweepDueDomains } from '@/lib/domains/service'

  const HTTP_UNAUTHORIZED = 401

  export const GET = async (request: Request) => {
    const authorizationHeader = request.headers.get('authorization')
    if (authorizationHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return errorResponse(HTTP_UNAUTHORIZED, 'unauthorized', 'Unauthorized')
    }
    const checkedDomains = await sweepDueDomains(new Date())
    return NextResponse.json({ checkedDomains })
  }
  ```

- `vercel.json` — schedules this route daily (`"0 6 * * *"`). Do not change it.
- Verified: the **only** caller of `sweepDueDomains` is this route, and
  nothing else consumes the `{ checkedDomains }` response shape (the public
  API docs in `src/lib/docs/` cover `/api/domains` only). Changing both
  together is safe.
- `runCheck` (imported from `./checks`) performs the DNS checks and DB writes
  for one domain and can throw on infrastructure errors.
- There is no `export const maxDuration` anywhere in the repo yet. Next.js
  requires route segment config values to be statically analyzable literals,
  which is why step 2 uses a bare number — the repo's no-magic-numbers rule
  is satisfied by the `maxDuration` name itself.

## Commands you will need

| Purpose   | Command          | Expected on success |
|-----------|------------------|---------------------|
| Lint      | `pnpm lint`      | exit 0              |
| Typecheck | `pnpm typecheck` | exit 0              |
| Tests     | `pnpm test`      | all pass            |

## Scope

**In scope** (the only files you should modify):
- `src/lib/domains/service.ts` (only `sweepDueDomains` and the module-level
  constants block at the top)
- `src/app/api/cron/revalidate/route.ts`

**Out of scope** (do NOT touch, even though they look related):
- `vercel.json` — the schedule is a recorded decision.
- `src/lib/domains/checks.ts` (`runCheck`) and `src/lib/dns/*` — check
  internals and timeouts are not part of this plan.
- Introducing any queue, `after()` deferral, or schedule change.

## Git workflow

- Branch: `advisor/003-cron-sweep-bounding`
- Imperative commit summary, matching repo history. NEVER add
  `Co-Authored-By` lines or any AI attribution.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Chunked, deadline-aware, failure-isolated sweep

In `src/lib/domains/service.ts`, add to the module-level constants (next to
`CRON_BATCH_SIZE`):

```ts
const CRON_CONCURRENCY = 5
const SWEEP_DEADLINE_MS = 250 * 1000
```

(Concurrency 5: worst-case chunk is ~30s, so 5 chunks of 5 ≈ 150s, inside the
deadline; 5 simultaneous checks ≈ 15 concurrent Neon HTTP requests at the
checks' write points, which the HTTP driver handles. Deadline 250s: safely
under the 300s `maxDuration` set in step 2.)

Replace `sweepDueDomains` with:

```ts
export type SweepResult = {
  checked: number
  failed: number
  remaining: number
}

export const sweepDueDomains = async (now: Date): Promise<SweepResult> => {
  const dueDomains = await db
    .select()
    .from(domains)
    .where(
      and(lte(domains.nextCheckAt, now), inArray(domains.status, [...CHECKABLE_STATUSES])),
    )
    .orderBy(asc(domains.nextCheckAt))
    .limit(CRON_BATCH_SIZE)
  const deadlineAt = now.getTime() + SWEEP_DEADLINE_MS
  let checked = 0
  let failed = 0
  let nextIndex = 0
  while (nextIndex < dueDomains.length && Date.now() < deadlineAt) {
    const chunk = dueDomains.slice(nextIndex, nextIndex + CRON_CONCURRENCY)
    const results = await Promise.allSettled(chunk.map((domain) => runCheck(domain, 'cron')))
    checked += results.filter((result) => result.status === 'fulfilled').length
    failed += results.filter((result) => result.status === 'rejected').length
    nextIndex += chunk.length
  }
  return { checked, failed, remaining: dueDomains.length - nextIndex }
}
```

Notes: `Promise.allSettled` (not `Promise.all`) is load-bearing — one thrown
`runCheck` must not abort the rest of the chunk. The query is unchanged.

**Verify**: `pnpm typecheck` → exit 0 (it will fail until step 2 updates the
route's use of the old `number` return — if so, proceed to step 2 and verify
after).

### Step 2: Update the cron route

Replace the body of `src/app/api/cron/revalidate/route.ts` handler and add
`maxDuration`:

```ts
import { NextResponse } from 'next/server'
import { errorResponse } from '@/lib/http/responses'
import { sweepDueDomains } from '@/lib/domains/service'

const HTTP_UNAUTHORIZED = 401

export const maxDuration = 300

export const GET = async (request: Request) => {
  const authorizationHeader = request.headers.get('authorization')
  if (authorizationHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return errorResponse(HTTP_UNAUTHORIZED, 'unauthorized', 'Unauthorized')
  }
  const sweep = await sweepDueDomains(new Date())
  return NextResponse.json(sweep)
}
```

The response becomes `{ checked, failed, remaining }` — a truncated sweep is
now visible in the Vercel cron logs instead of a killed invocation.

**Verify**: `pnpm typecheck` → exit 0. `pnpm lint` → exit 0.

### Step 3: Full gate

**Verify**: `pnpm lint && pnpm typecheck && pnpm test` → all exit 0.

## Test plan

- No new unit tests: `sweepDueDomains` is DB-bound end to end and this repo
  has no DB test harness (all existing tests cover pure modules in
  `src/lib/dns` and `src/lib/domains`). The pure pieces here (slicing,
  counting) don't warrant extraction.
- Manual verification if a local env with `DATABASE_URL` and `CRON_SECRET` is
  available (otherwise flag for the reviewer):
  `pnpm dev`, then
  `curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/revalidate`
  → JSON with `checked`/`failed`/`remaining` keys and
  `checked + failed + remaining` equal to the number of due domains (0s are
  fine on an empty DB). Never print the secret's value into any report.
- Verification: `pnpm test` → all existing tests pass.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm test` all exit 0
- [ ] `grep -n "allSettled" src/lib/domains/service.ts` → one match in `sweepDueDomains`
- [ ] `grep -n "for (const domain of dueDomains)" src/lib/domains/service.ts` → no matches
- [ ] `grep -n "maxDuration" src/app/api/cron/revalidate/route.ts` → `export const maxDuration = 300`
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The `sweepDueDomains` or route excerpts no longer match the live files.
- You find any additional caller of `sweepDueDomains` or consumer of the
  `{ checkedDomains }` response shape (grep before assuming — the plan's
  claim of a single caller was verified on 2026-08-01).
- Typechecking reveals `runCheck`'s signature differs from
  `(domain, 'cron')` as used in the excerpt.
- You feel the need to change timeouts in `src/lib/dns/constants.ts` or the
  cron schedule to make the math work — that is a re-plan, not an
  improvisation.

## Maintenance notes

- If domain count grows enough that 25/day with `remaining > 0` becomes
  chronic, the recorded scale path is a queue (`DECISIONS.md` §10) — raise
  that decision rather than inflating `CRON_BATCH_SIZE`/concurrency.
- Reviewer should scrutinize: the deadline check happens **between** chunks —
  a chunk in flight is never abandoned, which is why `SWEEP_DEADLINE_MS`
  (250s) + worst-case chunk (~30s) must stay under `maxDuration` (300s). If
  any of those three numbers changes, re-check the inequality.
- Deferred: alerting on `failed`/`remaining` from cron logs — Vercel
  observability configuration, out of code scope.
