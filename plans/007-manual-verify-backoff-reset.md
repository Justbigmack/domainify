# Plan 007 — Manual verify resets the automatic backoff clock

Priority: P2 · Effort: S · Depends on: none (compounds with 005) · Status: TODO

## Executor protocol (read first)

1. Read `resend-challenge-progress.md` before starting; append a session entry when
   done.
2. Verification bar: `pnpm test && pnpm lint && pnpm build` green.
3. Code style: no comments, named constants, no `any`, `import type`.

## Problem

`runCheck` (src/lib/domains/checks.ts:83–129) schedules the next automatic check
as `computeNextCheckAt(nextStatus, attemptCount, checkedAt)` where `attemptCount`
counts every check since the current token was minted
(`countChecksForCurrentToken`, checks.ts:52). The backoff is
`min(60s · 1.15ⁿ, 4h)` (src/lib/domains/schedule.ts:8).

So after a domain has accumulated, say, 40 checks, the automatic cadence sits at
the 4-hour cap. When the user then clicks "Check now" — a signal that means
"I just changed my DNS, look again soon" — the manual check runs immediately, but
if the record still isn't visible (propagation, negative caching), the *next
automatic* check is scheduled another ~4h out. The user's intent should reset the
ladder: check frequently again, backing off from the fast end.

Industry precedent, now citable from primary docs (see
`resend-challenge-scale-research.md` §2.3): Cloudflare officially documents that a
no-change PATCH on a custom hostname "resets the validation backoff schedule";
Resend's `POST /domains/{id}/verify` resets the domain to `pending` and restarts
the cycle.

## Design

Reset is trigger-scoped, not status-scoped: a `manual` check schedules its
follow-up as if it were attempt zero. All other triggers (`poll`, `cron`,
`on_read`) keep the accumulated ladder. Verified domains are unaffected
(`computeNextCheckAt` returns +24h regardless of attempts) and `failed` domains
are unaffected (returns null).

Implement as a pure helper in `schedule.ts` so it is trivially unit-testable, and
call it from `runCheck`:

```ts
// schedule.ts
import type { CheckTrigger } from '../dns/types'

export const scheduleAttempts = (trigger: CheckTrigger, attemptCount: number): number =>
  trigger === 'manual' ? 0 : attemptCount
```

```ts
// checks.ts, inside runCheck — current line 114:
//   nextCheckAt: computeNextCheckAt(nextStatus, attemptCount, checkedAt),
// becomes:
      nextCheckAt: computeNextCheckAt(nextStatus, scheduleAttempts(trigger, attemptCount), checkedAt),
```

Notes:
- `checks.ts` already has `trigger` in scope (function parameter) — no signature
  changes anywhere.
- Do not special-case inside `computeNextCheckAt` itself; it stays
  trigger-agnostic (it's also exercised by `schedule.test.ts` as a pure
  status/attempts function).
- The import of `CheckTrigger` into `schedule.ts` must use `import type`.
- `attemptCount` is still computed once (checks.ts:106) — leave the query alone.

## Interaction with existing behavior (verify, don't assume)

- Manual checks are cooldown-limited to one per 5s (`verifyDomain`,
  service.ts:124–134) — a user cannot spam-reset into a hot loop worse than the
  existing client poll (30s), and each reset only re-enters the ladder that
  itself backs off again. No additional limiting needed.
- With plan 005 landed, the reset has real effect for closed-tab users: the next
  external sweep (≤5 min away) picks the domain up because `next_check_at` is
  now ~60s out instead of ~4h. Without 005, the reset still helps the on-read
  trigger. Either order ships value; note which state you tested in the progress
  file.
- `regenerateToken`/`restartVerification` already reset the ladder implicitly
  (new `tokenGeneratedAt` zeroes `countChecksForCurrentToken`) — unchanged.

## Tests

Extend `src/lib/domains/schedule.test.ts` (pure, no mocks needed):

1. `scheduleAttempts('manual', 40)` → `0`.
2. `scheduleAttempts('poll', 40)` → `40`; same for `'cron'` and `'on_read'`
   (iterate `CHECK_TRIGGERS` minus `'manual'` rather than hardcoding, importing
   `CHECK_TRIGGERS` from `@/lib/dns/types`).
3. Composition check: `computeNextCheckAt('pending', scheduleAttempts('manual', 40), now)`
   equals `now + 60s` (the base delay), while with `'cron'` it equals the 4h cap.

If `src/lib/domains/checks.test.ts` exists with a mocked-db harness for
`runCheck`, add one integration-style case asserting the persisted
`nextCheckAt` for a manual trigger with a high prior attempt count; if no such
harness exists, do NOT build one for this plan — the pure tests above plus the
one-line call-site diff are sufficient.

## Docs (small, same commit)

- `(docs)/docs/domains/verification` page: one sentence in the
  backoff/cadence section — checking manually resets the automatic schedule to
  its fastest cadence. Use the brand typography components.
- DECISIONS.md §10: append the Cloudflare citation sentence (documented
  PATCH-reset behavior) as external validation.

## Acceptance checklist

- [ ] `scheduleAttempts` exists in `schedule.ts`, typed via `CheckTrigger`.
- [ ] `runCheck` uses it; no other call sites of `computeNextCheckAt` changed.
- [ ] New unit tests pass; whole suite green.
- [ ] Docs sentence + DECISIONS citation added.

## STOP conditions

- STOP if `checks.ts` line numbers have drifted such that the described call site
  doesn't match — re-read the file and re-derive; do not apply a blind edit.
- STOP if adding the `CheckTrigger` import creates a dependency cycle
  (schedule.ts ← checks.ts ← … ← dns/types is expected to be acyclic; dns/types
  imports nothing from domains/) — if a cycle appears, inline a local
  `'manual'` comparison in checks.ts instead and note the deviation.
