# Plan 002: Harden the verification polling loop (retry storm, server cooldown, redundant refreshes, countdown re-renders)

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
- **Effort**: M
- **Risk**: LOW
- **Depends on**: plans/001-verification-baseline.md (green lint gate)
- **Category**: bug
- **Planned at**: commit `4ce0032` (+ uncommitted working tree), 2026-08-01

## Why this matters

The pending-domain page polls a server action every 30 seconds. Four defects
compound there:

1. **Retry storm**: if the poll action rejects (transient DNS or DB error),
   the countdown is never reset, so the effect re-fires immediately with zero
   delay — one tab becomes a continuous loop of real DNS lookups and DB
   writes.
2. **No server throttle**: `pollDomain` has no cooldown (its sibling
   `verifyDomain` has one), so any authenticated caller can drive checks as
   fast as they can post.
3. **Double rendering**: every action already calls `revalidatePath`, which in
   Next.js 16 re-renders the route and returns the fresh RSC payload in the
   action response — the `router.refresh()` calls after them do all that work
   a second time, on every poll cycle.
4. **Wasted renders + hidden tabs**: the 1-second countdown state lives at the
   top of `VerifySteps`, re-rendering the entire subtree every tick, and
   polling continues in backgrounded tabs for up to the 72-hour pending
   window.

## Current state

Next.js 16.2.11 App Router + React 19.2.4 + TypeScript strict, pnpm, Vitest.
Repo conventions that apply here: no code comments; no `any`; no magic numbers
(named constants); handlers are `const` arrow functions with a `handle`
prefix; booleans prefixed `is`/`has`/`should`; `import type` for type-only
imports; max 250 lines per file; no ternaries inside `className` — use `cn()`
with object syntax; do not put ternaries inside hook-call arguments (compute a
named variable first); components are PascalCase files with flat named
exports.

Relevant files:

- `src/lib/domains/schedule.ts` — pure scheduling helpers (no imports beyond a
  type). Exemplar for where the new pure helpers go. Full current content:

  ```ts
  import type { DomainStatus } from './status'

  const BASE_DELAY_MS = 60 * 1000
  const BACKOFF_FACTOR = 1.15
  const MAX_DELAY_MS = 4 * 60 * 60 * 1000
  const VERIFIED_RECHECK_INTERVAL_MS = 24 * 60 * 60 * 1000

  export const nextCheckDelayMs = (attemptCount: number): number =>
    Math.min(BASE_DELAY_MS * BACKOFF_FACTOR ** attemptCount, MAX_DELAY_MS)

  export const computeNextCheckAt = (
    status: DomainStatus,
    attemptCount: number,
    now: Date,
  ): Date | null => {
    if (status === 'failed') return null
    if (status === 'verified') return new Date(now.getTime() + VERIFIED_RECHECK_INTERVAL_MS)
    return new Date(now.getTime() + nextCheckDelayMs(attemptCount))
  }
  ```

- `src/lib/domains/constants.ts` — full current content:

  ```ts
  const HOUR_IN_MS = 60 * 60 * 1000
  const MINUTE_IN_MS = 60 * 1000

  export const PENDING_WINDOW_MS = 72 * HOUR_IN_MS
  export const GRACE_WINDOW_MS = 72 * HOUR_IN_MS
  export const MANUAL_CHECK_COOLDOWN_MS = 5 * 1000
  export const STALE_CHECK_THRESHOLD_MS = 2 * MINUTE_IN_MS
  export const TOKEN_BYTE_LENGTH = 32
  ```

- `src/lib/domains/service.ts:120-139` — the cooldown asymmetry:

  ```ts
  export const verifyDomain = async (
    userId: string,
    domainId: string,
  ): Promise<CheckRunResult> => {
    const domain = await getOwnedDomain(userId, domainId)
    const now = new Date()
    if (domain.lastManualCheckAt !== null) {
      const elapsedMs = now.getTime() - domain.lastManualCheckAt.getTime()
      if (elapsedMs < MANUAL_CHECK_COOLDOWN_MS) {
        throw new VerifyCooldownError(MANUAL_CHECK_COOLDOWN_MS - elapsedMs)
      }
    }
    await db.update(domains).set({ lastManualCheckAt: now }).where(eq(domains.id, domain.id))
    return runCheck({ ...domain, lastManualCheckAt: now }, 'manual')
  }

  export const pollDomain = async (userId: string, domainId: string): Promise<CheckRunResult> => {
    const domain = await getOwnedDomain(userId, domainId)
    return runCheck(domain, 'poll')
  }
  ```

  `domains.lastCheckedAt` exists in the schema (`src/db/schema.ts:29`,
  `timestamp('last_checked_at')`) and is already read by `isStale` at
  `service.ts:98-101`. `VerifyCooldownError` is imported at the top of
  `service.ts` from `./errors`; `MANUAL_CHECK_COOLDOWN_MS` from `./constants`.

- `src/lib/domains/actions.ts:38-42` — every mutation action already
  revalidates:

  ```ts
  const revalidateDomainPaths = (domainId: string): void => {
    revalidatePath('/domains')
    revalidatePath(`/domains/${domainId}`)
    revalidatePath(`/domains/add/${domainId}`)
  }
  ```

  `pollDomainAction` / `verifyDomainAction` / `restartVerificationAction` /
  `regenerateTokenAction` all call it, then return
  `{ ok: true }` or `{ ok: false, error: { code, message, retryAfterMs? } }`
  (`ActionResult`, `actions.ts:22-28`). `toActionFailure` (`actions.ts:44-58`)
  **rethrows** any error that is not `DomainNotFoundError` /
  `DomainStateError` / `VerifyCooldownError`, so the promise a client awaits
  can reject.

- `src/app/(dashboard)/domains/_components/VerifySteps.tsx` (228 lines,
  `'use client'`) — the poll loop. Key excerpts:

  ```tsx
  const POLL_INTERVAL_SECONDS = 30
  const SECOND_MS = 1000
  ```

  State (lines 103-110): `useId`, `useRouter`, `useTransition` (as
  `[isChecking, startTransition]`), `countdownSeconds`, `phaseIndex`,
  `cooldownMessage`, `providerId`.

  The three effects + manual handler (lines 112-151):

  ```tsx
  useEffect(() => {
    if (!isChecking) return
    const timer = setInterval(
      () => setPhaseIndex((current) => (current + 1) % CHECK_PHASES.length),
      PHASE_ROTATION_MS,
    )
    return () => clearInterval(timer)
  }, [isChecking])

  useEffect(() => {
    if (isChecking) return
    const timer = setInterval(
      () => setCountdownSeconds((current) => (current > 0 ? current - 1 : current)),
      SECOND_MS,
    )
    return () => clearInterval(timer)
  }, [isChecking])

  useEffect(() => {
    if (countdownSeconds !== 0 || isChecking) return
    startTransition(async () => {
      setPhaseIndex(0)
      await pollDomainAction(domainId)
      router.refresh()
      setCountdownSeconds(POLL_INTERVAL_SECONDS)
    })
  }, [countdownSeconds, isChecking, domainId, router, startTransition])

  const handleVerify = () => {
    setCooldownMessage(null)
    setPhaseIndex(0)
    startTransition(async () => {
      const result = await verifyDomainAction(domainId)
      if (!result.ok && result.error.code === 'cooldown') {
        setCooldownMessage(result.error.message)
      }
      router.refresh()
      setCountdownSeconds(POLL_INTERVAL_SECONDS)
    })
  }
  ```

  The failure mode: `pollDomainAction` rejects → `setCountdownSeconds` on line
  136 never runs → `countdownSeconds` stays `0` → when `isChecking` flips back
  to `false` the effect deps change and the guard passes again → immediate
  re-fire, forever.

  The countdown is displayed in exactly one place (line 168):
  `` `Next check in ${countdownSeconds}s` `` inside a `<Text as="span"
  aria-live="polite" …>` block that shows a `<Spinner />` + phase text while
  `isChecking`.

- `src/app/(dashboard)/domains/_components/RestartButton.tsx:17-22`:

  ```tsx
  const handleRestart = () => {
    startTransition(async () => {
      await restartVerificationAction(domainId)
      router.refresh()
    })
  }
  ```

- `src/app/(dashboard)/domains/_components/DangerZone.tsx:71-77`:

  ```tsx
  const handleRegenerate = () => {
    startTransition(async () => {
      await regenerateTokenAction(domainId)
      setPendingAction(null)
      router.refresh()
    })
  }
  ```

- Next.js 16 fact (verified against the vendored docs at
  `node_modules/next/dist/docs/01-app/02-guides/server-actions.md`): when a
  server action calls `revalidatePath`, Next.js re-renders the current route
  server-side and includes the fresh RSC payload in the action's response —
  no follow-up `router.refresh()` is needed for the current page to update.

- `src/lib/domains/schedule.test.ts` — the test file to extend; it is a plain
  Vitest `describe`/`it`/`expect` file colocated with the module (model new
  tests after `src/lib/domains/errors.test.ts` style: small `describe` per
  function, explicit literal expectations).

## Commands you will need

| Purpose   | Command          | Expected on success |
|-----------|------------------|---------------------|
| Lint      | `pnpm lint`      | exit 0              |
| Typecheck | `pnpm typecheck` | exit 0              |
| Tests     | `pnpm test`      | all pass            |

## Suggested executor toolkit

- If the `vercel-react-best-practices` skill is available, consult its
  `rerender-*` rules when writing `PollCountdown` (step 4).
- If browser automation (claude-in-chrome) is available, use it for the manual
  checks in the test plan; otherwise flag them for the reviewer.

## Scope

**In scope** (the only files you should modify or create):
- `src/lib/domains/schedule.ts` and `src/lib/domains/schedule.test.ts`
- `src/lib/domains/constants.ts`
- `src/lib/domains/service.ts` (only `verifyDomain` and `pollDomain`)
- `src/app/(dashboard)/domains/_components/VerifySteps.tsx`
- `src/app/(dashboard)/domains/_components/PollCountdown.tsx` (create)
- `src/app/(dashboard)/domains/_components/RestartButton.tsx`
- `src/app/(dashboard)/domains/_components/DangerZone.tsx` (only
  `handleRegenerate` and the `useRouter` import)

**Out of scope** (do NOT touch, even though they look related):
- `src/app/settings/_components/ApiKeyRowActions.tsx:44` and
  `src/app/settings/_components/ApiKeysCard.tsx:75` — their
  `router.refresh()` calls follow **Better Auth client calls**, not server
  actions with `revalidatePath`; they are required and correct.
- `src/lib/domains/actions.ts` — its error mapping is reworked by plan 004;
  changing it here creates a conflict.
- `src/lib/domains/checks.ts` and everything under `src/lib/dns/` — the check
  pipeline itself is not part of this plan.
- The `handleRemove` path in `DangerZone.tsx` — `deleteDomainAction` ends in a
  server-side `redirect`, which is why it has no `router.refresh()`.

## Git workflow

- Branch: `advisor/002-polling-hardening`
- One commit per step or logical unit; imperative summary line, matching repo
  history (e.g. `Harden auth per Better Auth guidance: …`).
- NEVER add `Co-Authored-By` lines or any AI attribution to commits.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Add pure helpers to `schedule.ts` with tests

Append to `src/lib/domains/schedule.ts`:

```ts
const POLL_BASE_DELAY_SECONDS = 30
const POLL_BACKOFF_FACTOR = 2
const POLL_MAX_DELAY_SECONDS = 300

export const pollDelaySeconds = (failureCount: number): number =>
  Math.min(POLL_BASE_DELAY_SECONDS * POLL_BACKOFF_FACTOR ** failureCount, POLL_MAX_DELAY_SECONDS)

export const cooldownRemainingMs = (
  lastAttemptAt: Date | null,
  cooldownMs: number,
  now: Date,
): number => {
  if (lastAttemptAt === null) return 0
  const elapsedMs = now.getTime() - lastAttemptAt.getTime()
  return Math.max(cooldownMs - elapsedMs, 0)
}
```

Add to `src/lib/domains/schedule.test.ts` (same style as the existing
describes in that file):

- `pollDelaySeconds`: `0 → 30`, `1 → 60`, `2 → 120`, `3 → 240`, `4 → 300`
  (capped), `10 → 300`.
- `cooldownRemainingMs`: `null` last attempt → `0`; elapsed ≥ cooldown → `0`;
  elapsed 2s of a 5s cooldown → `3000`.

**Verify**: `pnpm test` → all pass including the new cases. `pnpm typecheck` → exit 0.

### Step 2: Server-side cooldown for `pollDomain`; reuse the helper in `verifyDomain`

In `src/lib/domains/constants.ts` add:

```ts
export const POLL_CHECK_COOLDOWN_MS = 15 * 1000
```

(15s = half the client's 30s base interval, so legitimate polls never trip it
even with clock skew, while a runaway loop is capped at ~4 checks/min.)

In `src/lib/domains/service.ts`:

- Import `cooldownRemainingMs` from `./schedule` and `POLL_CHECK_COOLDOWN_MS`
  from `./constants`.
- Replace the inline cooldown block in `verifyDomain` (the
  `if (domain.lastManualCheckAt !== null) { … }` lines shown in Current
  state) with:

  ```ts
  const remainingMs = cooldownRemainingMs(domain.lastManualCheckAt, MANUAL_CHECK_COOLDOWN_MS, now)
  if (remainingMs > 0) throw new VerifyCooldownError(remainingMs)
  ```

- Rewrite `pollDomain`:

  ```ts
  export const pollDomain = async (userId: string, domainId: string): Promise<CheckRunResult> => {
    const domain = await getOwnedDomain(userId, domainId)
    const remainingMs = cooldownRemainingMs(domain.lastCheckedAt, POLL_CHECK_COOLDOWN_MS, new Date())
    if (remainingMs > 0) throw new VerifyCooldownError(remainingMs)
    return runCheck(domain, 'poll')
  }
  ```

`VerifyCooldownError` flows through the existing `toActionFailure` mapping in
`actions.ts` as `{ ok: false, error: { code: 'cooldown', … } }` — no action
changes needed.

**Verify**: `pnpm typecheck` → exit 0. `pnpm test` → all pass.
`grep -n "lastManualCheckAt !== null" src/lib/domains/service.ts` → no matches.

### Step 3: Rework the poll loop in `VerifySteps.tsx` (retry storm, backoff, visibility, no refresh)

Replace the countdown-driven trigger with a deadline-driven one. Changes to
`src/app/(dashboard)/domains/_components/VerifySteps.tsx`:

- Delete `const POLL_INTERVAL_SECONDS = 30` (superseded by
  `pollDelaySeconds`); keep `SECOND_MS` and `PHASE_ROTATION_MS`.
- Import `pollDelaySeconds` from `@/lib/domains/schedule` and `PollCountdown`
  from `./PollCountdown` (created in step 4). Remove the `useRouter` import
  and the `const router = useRouter()` line.
- Replace the `countdownSeconds` state with:

  ```tsx
  const [nextCheckAt, setNextCheckAt] = useState(() => Date.now() + pollDelaySeconds(0) * SECOND_MS)
  const [failureCount, setFailureCount] = useState(0)
  ```

- Delete the 1-second countdown interval effect entirely (it moves into
  `PollCountdown`). Keep the `phaseIndex` rotation effect unchanged.
- Replace the poll-trigger effect with:

  ```tsx
  useEffect(() => {
    if (isChecking) return
    const delayMs = Math.max(nextCheckAt - Date.now(), 0)
    const timer = setTimeout(() => {
      if (document.visibilityState === 'hidden') return
      startTransition(async () => {
        setPhaseIndex(0)
        let isPollHealthy = false
        try {
          const result = await pollDomainAction(domainId)
          isPollHealthy = result.ok || result.error.code === 'cooldown'
        } catch {
          isPollHealthy = false
        }
        const nextFailureCount = isPollHealthy ? 0 : failureCount + 1
        setFailureCount(nextFailureCount)
        setNextCheckAt(Date.now() + pollDelaySeconds(nextFailureCount) * SECOND_MS)
      })
    }, delayMs)
    return () => clearTimeout(timer)
  }, [nextCheckAt, isChecking, failureCount, domainId, startTransition])
  ```

  (A server `cooldown` response means the server is healthy but throttled, so
  it does not count as a failure.)

- Add a visibility-resume effect so a hidden tab stops polling and a
  re-focused tab resumes at most once, immediately:

  ```tsx
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return
      setNextCheckAt((current) => (current <= Date.now() ? Date.now() : current))
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])
  ```

- Rewrite `handleVerify` so a rejected action can no longer strand the loop,
  and drop its `router.refresh()`:

  ```tsx
  const handleVerify = () => {
    setCooldownMessage(null)
    setPhaseIndex(0)
    startTransition(async () => {
      try {
        const result = await verifyDomainAction(domainId)
        if (!result.ok && result.error.code === 'cooldown') {
          setCooldownMessage(result.error.message)
        }
      } catch {
        setCooldownMessage(null)
      }
      setFailureCount(0)
      setNextCheckAt(Date.now() + pollDelaySeconds(0) * SECOND_MS)
    })
  }
  ```

- In the JSX, replace the `` `Next check in ${countdownSeconds}s` `` branch
  with `<PollCountdown key={nextCheckAt} deadline={nextCheckAt} />` (the
  surrounding `<Text aria-live="polite">` wrapper and the
  spinner-while-checking branch stay as they are).

**Verify**: `pnpm typecheck` → exit 0. `pnpm lint` → exit 0.
`grep -n "router.refresh\|useRouter" 'src/app/(dashboard)/domains/_components/VerifySteps.tsx'` → no matches.

### Step 4: Create the `PollCountdown` leaf component

Create `src/app/(dashboard)/domains/_components/PollCountdown.tsx`:

```tsx
'use client'

import { useEffect, useState } from 'react'

const SECOND_MS = 1000

const toRemainingSeconds = (deadline: number): number =>
  Math.max(Math.ceil((deadline - Date.now()) / SECOND_MS), 0)

type PollCountdownProps = {
  deadline: number
}

export const PollCountdown = ({ deadline }: PollCountdownProps) => {
  const [remainingSeconds, setRemainingSeconds] = useState(() => toRemainingSeconds(deadline))

  useEffect(() => {
    const timer = setInterval(
      () => setRemainingSeconds(toRemainingSeconds(deadline)),
      SECOND_MS,
    )
    return () => clearInterval(timer)
  }, [deadline])

  return <>Next check in {remainingSeconds}s</>
}
```

The parent passes `key={nextCheckAt}`, so a new deadline remounts the
component and the lazy initializer recomputes — no state-syncing effect
needed, and the 1-second tick now re-renders only this text fragment.

**Verify**: `pnpm typecheck` → exit 0. `pnpm lint` → exit 0.

### Step 5: Drop the redundant refreshes in `RestartButton` and `DangerZone`

- `RestartButton.tsx`: delete `router.refresh()` from `handleRestart`, then
  delete the now-unused `useRouter` import and `const router = useRouter()`.
- `DangerZone.tsx`: delete `router.refresh()` from `handleRegenerate` only,
  then delete the now-unused `useRouter` import and `const router =
  useRouter()` (verify nothing else in the file uses `router` first —
  `handleRemove` does not).

**Verify**: `pnpm lint` → exit 0 (catches unused imports).
`grep -rn "router.refresh" 'src/app/(dashboard)'` → no matches.

### Step 6: Full gate

**Verify**: `pnpm lint && pnpm typecheck && pnpm test` → all exit 0.

## Test plan

- New unit tests (step 1) in `src/lib/domains/schedule.test.ts`:
  `pollDelaySeconds` growth and cap; `cooldownRemainingMs` null / expired /
  mid-cooldown. Model after `src/lib/domains/errors.test.ts`.
- The component loop has no test harness (no component tests exist in this
  repo) — manual verification if a browser is available, otherwise flag for
  the reviewer: on `/domains/add/<id>` for a pending domain, (a) countdown
  ticks and a poll fires ~every 30s (Network tab: one action POST per cycle,
  and only **one** RSC render per cycle — no second request from a refresh);
  (b) with DevTools offline mode on, polls back off (30s → 60s → 120s …)
  instead of firing continuously; (c) after switching to another tab for 2+
  minutes, no polls fire until the tab is refocused, then exactly one fires.
- Verification: `pnpm test` → all pass, including the new schedule cases.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm test` all exit 0
- [ ] `grep -rn "router.refresh" 'src/app/(dashboard)'` → no matches
- [ ] `grep -n "POLL_CHECK_COOLDOWN_MS" src/lib/domains/service.ts src/lib/domains/constants.ts` → one use + one definition
- [ ] `grep -n "pollDelaySeconds\|cooldownRemainingMs" src/lib/domains/schedule.ts` → both exported
- [ ] `src/app/(dashboard)/domains/_components/PollCountdown.tsx` exists
- [ ] `VerifySteps.tsx` is ≤ 250 lines (`wc -l`)
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- Any excerpt in "Current state" no longer matches the live file.
- `pnpm lint` flags `react-hooks/set-state-in-effect` or
  `react-hooks/exhaustive-deps` in the new effects and one restructuring
  attempt following the target shapes doesn't clear it.
- The UI stops updating after a poll once `router.refresh()` is removed
  (would contradict the documented `revalidatePath` behavior — report, do not
  re-add the refresh silently).
- You find another consumer of `POLL_INTERVAL_SECONDS` or `countdownSeconds`
  outside `VerifySteps.tsx`.
- Removing `useRouter` from `DangerZone.tsx` breaks anything in that file
  other than `handleRegenerate`.

## Maintenance notes

- If a future change adds server-driven poll cadence (e.g. reading
  `nextCheckAt` from the domain row), `pollDelaySeconds` is the single place
  client cadence is defined.
- Reviewer should scrutinize: the `isPollHealthy` classification (cooldown ≠
  failure), and that `key={nextCheckAt}` is present on `PollCountdown` — the
  component intentionally has no deadline-sync effect and goes stale without
  the key.
- Deferred (plan 004): unifying the action/API error mapping that this loop's
  `result.error.code` checks rely on.
- Deferred (audit finding, unplanned): a REST twin for poll
  (`/api/domains/[id]/poll`) if API consumers ever need it — a product call.
