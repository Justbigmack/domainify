# Plan 004: Unify the domain error contract and add route error boundaries

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

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW
- **Depends on**: plans/001-verification-baseline.md (green lint gate).
  Coordinate with plans/002-polling-hardening.md: both touch feature files in
  `(dashboard)`, but only this plan touches `actions.ts` — execute 002 first
  or on a separate branch and rebase.
- **Category**: tech-debt
- **Planned at**: commit `4ce0032` (+ uncommitted working tree), 2026-08-01

## Why this matters

The same five domain error classes are mapped to user-facing shapes in two
hand-maintained switch tables — one for API routes, one for server actions —
and they have already drifted: the API puts `retryAfterMs` at the top level of
the JSON body while actions nest it inside `error`, and the action table
silently rethrows two error classes the API table handles. `README.md`
promises "exactly one implementation of every operation, so the API can't
drift from the UI"; the operations share `service.ts`, but the error contract
has drifted. Separately, the app has **zero** error boundaries — no
`error.tsx`, `not-found.tsx`, or `global-error.tsx` anywhere — while the code
actively throws into that void (`notFound()` on two pages, rethrown unmapped
action errors, a module-scope throw in `src/db/index.ts` when `DATABASE_URL`
is missing). Any unmapped failure renders the unbranded default Next.js error
page with no recovery affordance.

## Current state

Next.js 16.2.11 App Router + React 19.2.4 + TypeScript strict (but NOT
`exactOptionalPropertyTypes`), pnpm, Vitest. Repo conventions: no code
comments; no `any`; no magic numbers (named constants); handlers `handle`
prefix; `import type` for type-only imports; PascalCase component files with
flat named exports; error/route special files use default exports as Next.js
requires; no ternaries in `className` — `cn()` object syntax; Tailwind
canonical classes only.

**Hard contract constraint**: the public API error shapes are documented and
must stay byte-identical. From `src/lib/docs/apiExamples.ts:115-128`:

```ts
export const ERROR_SHAPE_EXAMPLE = toJson({
  error: {
    code: 'duplicate',
    message: "You've already added app.example.com.",
  },
})

export const COOLDOWN_ERROR_EXAMPLE = toJson({
  error: {
    code: 'cooldown',
    message: 'Please wait a moment before checking again.',
  },
  retryAfterMs: 3200,
})
```

So: non-cooldown errors → `{ error: { code, message } }`; cooldown →
`{ error: { code, message }, retryAfterMs }` with `retryAfterMs` **top-level**.
The action shape (`retryAfterMs` nested inside `error`) is internal and stays
as-is — the point is one source of truth both project from, not identical
wire shapes.

Relevant files:

- `src/lib/domains/errors.ts` — the five error classes. Full current content
  relevant here:

  ```ts
  import type { DomainInputError } from '@/lib/dns/normalize'

  export class DomainNotFoundError extends Error {
    constructor() {
      super('Domain not found')
    }
  }

  export class DomainInputInvalidError extends Error {
    readonly detail: DomainInputError

    constructor(detail: DomainInputError) {
      super(detail.message)
      this.detail = detail
    }
  }

  export class DuplicateDomainError extends Error {
    constructor(hostname: string) {
      super(`You've already added ${hostname}.`)
    }
  }

  export class VerifyCooldownError extends Error {
    readonly retryAfterMs: number

    constructor(retryAfterMs: number) {
      super('Please wait a moment before checking again.')
      this.retryAfterMs = retryAfterMs
    }
  }

  export class DomainStateError extends Error {}
  ```

  (The file also has `isUniqueViolation` — leave it untouched.)
  `DomainInputError` (from `@/lib/dns/normalize`) has `code` and `message`
  string fields.

- `src/lib/http/responses.ts` — the API-side table, lines 25-45:

  ```ts
  export const serviceErrorResponse = (error: unknown): NextResponse => {
    if (error instanceof DomainNotFoundError) {
      return errorResponse(HTTP_NOT_FOUND, 'not_found', error.message)
    }
    if (error instanceof DomainInputInvalidError) {
      return errorResponse(HTTP_UNPROCESSABLE, error.detail.code, error.detail.message)
    }
    if (error instanceof DuplicateDomainError) {
      return errorResponse(HTTP_CONFLICT, 'duplicate', error.message)
    }
    if (error instanceof DomainStateError) {
      return errorResponse(HTTP_CONFLICT, 'invalid_state', error.message)
    }
    if (error instanceof VerifyCooldownError) {
      return NextResponse.json(
        { error: { code: 'cooldown', message: error.message }, retryAfterMs: error.retryAfterMs },
        { status: HTTP_TOO_MANY_REQUESTS },
      )
    }
    throw error
  }
  ```

  with `errorResponse(status, code, message)` at line 16 producing
  `{ error: { code, message } }`, and HTTP constants at lines 10-14
  (`HTTP_UNAUTHORIZED 401`, `HTTP_NOT_FOUND 404`, `HTTP_CONFLICT 409`,
  `HTTP_UNPROCESSABLE 422`, `HTTP_TOO_MANY_REQUESTS 429`).
  `unauthorizedResponse` and `invalidBodyResponse` also live here — leave
  them and `errorResponse` untouched.

- `src/lib/domains/actions.ts:44-58` — the action-side table:

  ```ts
  const toActionFailure = (error: unknown): ActionResult => {
    if (error instanceof DomainNotFoundError) {
      return { ok: false, error: { code: 'not_found', message: error.message } }
    }
    if (error instanceof DomainStateError) {
      return { ok: false, error: { code: 'invalid_state', message: error.message } }
    }
    if (error instanceof VerifyCooldownError) {
      return {
        ok: false,
        error: { code: 'cooldown', message: error.message, retryAfterMs: error.retryAfterMs },
      }
    }
    throw error
  }
  ```

  `ActionError` is `{ code: string; message: string; retryAfterMs?: number }`
  (lines 22-26). Note `toActionFailure` currently rethrows
  `DomainInputInvalidError`/`DuplicateDomainError`; those two are only ever
  thrown by `createDomain`, and `createDomainAction` (lines 60-82) handles
  them inline **without** calling `toActionFailure` — so mapping them in the
  shared table (step 3) changes no live behavior.

- Throw sites needing boundaries: `src/app/(dashboard)/domains/[id]/page.tsx`
  and `src/app/(dashboard)/domains/add/[id]/page.tsx` call `notFound()`;
  `find src/app -name "error.tsx" -o -name "not-found.tsx" -o -name
  "global-error.tsx"` returns nothing.

- Layout facts for boundary placement: `src/app/(dashboard)/layout.tsx`
  renders the sidebar shell around `<main>{children}</main>`; an `error.tsx`
  at `src/app/(dashboard)/` renders inside that shell. `src/app/settings/`
  has its own layout; `src/app/settings/error.tsx` renders inside it. A
  `not-found.tsx` at `src/app/(dashboard)/domains/` catches `notFound()` from
  both `domains/[id]` and `domains/add/[id]`.

- Components to reuse (do not restyle them):
  - `AlertBanner` (`src/components/brand/AlertBanner/index.ts` barrel exports
    `AlertBanner`, `AlertBannerAction`): props
    `{ tone: 'info' | 'success' | 'destructive', icon: LucideIcon, action?: ReactNode, className?, children }`.
  - `AlertBannerAction`: props `{ icon?, onClick?, disabled?, loading?, children }`.
  - `GhostButton` (`src/components/brand/GhostButton`): supports
    `href` + `icon` for link-styled buttons.
  - Page-width wrapper convention (from `src/app/(dashboard)/domains/loading.tsx:6`):
    `mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-8 lg:px-10`.

- Test exemplar: `src/lib/domains/errors.test.ts` — plain Vitest
  `describe`/`it`/`expect`, colocated.

## Commands you will need

| Purpose   | Command          | Expected on success |
|-----------|------------------|---------------------|
| Lint      | `pnpm lint`      | exit 0              |
| Typecheck | `pnpm typecheck` | exit 0              |
| Tests     | `pnpm test`      | all pass            |

## Scope

**In scope** (the only files you should modify or create):
- `src/lib/domains/errors.ts` and `src/lib/domains/errors.test.ts`
- `src/lib/http/responses.ts` (only `serviceErrorResponse`)
- `src/lib/domains/actions.ts` (only `toActionFailure`)
- Create: `src/components/brand/RouteError.tsx`,
  `src/app/(dashboard)/error.tsx`, `src/app/settings/error.tsx`,
  `src/app/(dashboard)/domains/not-found.tsx`, `src/app/global-error.tsx`

**Out of scope** (do NOT touch, even though they look related):
- The API JSON wire shapes and `src/lib/docs/apiExamples.ts` — the contract
  is frozen; this plan must not change any response byte.
- `createDomainAction`'s inline error handling — it feeds a form-state shape
  (`CreateDomainState`) and is correct as-is.
- `src/app/api/**/route.ts` handlers — they already call
  `serviceErrorResponse`; no changes needed.
- `(auth)` and `(docs)` route groups — lower-stakes surfaces, deliberately
  deferred.

## Git workflow

- Branch: `advisor/004-error-contract-and-boundaries`
- Imperative commit summaries, matching repo history. NEVER add
  `Co-Authored-By` lines or any AI attribution.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Add `toErrorDetail` to `errors.ts`

Append to `src/lib/domains/errors.ts` (below the class definitions, above
`isUniqueViolation`):

```ts
const HTTP_NOT_FOUND = 404
const HTTP_CONFLICT = 409
const HTTP_UNPROCESSABLE = 422
const HTTP_TOO_MANY_REQUESTS = 429

export type ServiceErrorDetail = {
  status: number
  code: string
  message: string
  retryAfterMs?: number
}

export const toErrorDetail = (error: unknown): ServiceErrorDetail | null => {
  if (error instanceof DomainNotFoundError) {
    return { status: HTTP_NOT_FOUND, code: 'not_found', message: error.message }
  }
  if (error instanceof DomainInputInvalidError) {
    return { status: HTTP_UNPROCESSABLE, code: error.detail.code, message: error.detail.message }
  }
  if (error instanceof DuplicateDomainError) {
    return { status: HTTP_CONFLICT, code: 'duplicate', message: error.message }
  }
  if (error instanceof DomainStateError) {
    return { status: HTTP_CONFLICT, code: 'invalid_state', message: error.message }
  }
  if (error instanceof VerifyCooldownError) {
    return {
      status: HTTP_TOO_MANY_REQUESTS,
      code: 'cooldown',
      message: error.message,
      retryAfterMs: error.retryAfterMs,
    }
  }
  return null
}
```

**Verify**: `pnpm typecheck` → exit 0.

### Step 2: Project the API response from the shared detail

In `src/lib/http/responses.ts`, import `toErrorDetail` from
`@/lib/domains/errors` and replace `serviceErrorResponse` with:

```ts
export const serviceErrorResponse = (error: unknown): NextResponse => {
  const detail = toErrorDetail(error)
  if (!detail) throw error
  if (detail.retryAfterMs === undefined) {
    return errorResponse(detail.status, detail.code, detail.message)
  }
  return NextResponse.json(
    { error: { code: detail.code, message: detail.message }, retryAfterMs: detail.retryAfterMs },
    { status: detail.status },
  )
}
```

The five now-unused error-class imports and the now-unused `HTTP_NOT_FOUND` /
`HTTP_CONFLICT` / `HTTP_TOO_MANY_REQUESTS` constants must be removed
(`HTTP_UNAUTHORIZED` and `HTTP_UNPROCESSABLE` stay — `unauthorizedResponse`
and `invalidBodyResponse` use them).

**Verify**: `pnpm lint` → exit 0 (catches leftover unused imports).
`pnpm typecheck` → exit 0.

### Step 3: Project the action failure from the shared detail

In `src/lib/domains/actions.ts`, replace `toActionFailure` with:

```ts
const toActionFailure = (error: unknown): ActionResult => {
  const detail = toErrorDetail(error)
  if (!detail) throw error
  return {
    ok: false,
    error: { code: detail.code, message: detail.message, retryAfterMs: detail.retryAfterMs },
  }
}
```

Add `toErrorDetail` to the existing `./errors` import; remove any error-class
names from that import that lint now reports as unused (keep the ones
`createDomainAction` still uses: `DomainInputInvalidError`,
`DuplicateDomainError`).

**Verify**: `pnpm lint` → exit 0. `pnpm typecheck` → exit 0.

### Step 4: Test the shared table

Add to `src/lib/domains/errors.test.ts` a `describe('toErrorDetail', …)` with:

- `DomainNotFoundError` → `{ status: 404, code: 'not_found', message: 'Domain not found' }`
- `DomainInputInvalidError` (construct with
  `{ code: 'invalid', message: 'Enter a valid domain.' }` cast-free) →
  `{ status: 422, code: 'invalid', message: 'Enter a valid domain.' }`
- `DuplicateDomainError('app.example.com')` → status 409, code `'duplicate'`,
  message containing `app.example.com`
- `DomainStateError('nope')` → `{ status: 409, code: 'invalid_state', message: 'nope' }`
- `VerifyCooldownError(3200)` → status 429, code `'cooldown'`,
  `retryAfterMs: 3200`
- a plain `new Error('boom')` → `null`, and `null` input → `null`

**Verify**: `pnpm test` → all pass including the new cases.

### Step 5: Shared `RouteError` panel + the two `error.tsx` boundaries

Create `src/components/brand/RouteError.tsx`:

```tsx
'use client'

import { TriangleAlertIcon } from 'lucide-react'
import { AlertBanner, AlertBannerAction } from '@/components/brand/AlertBanner'

type RouteErrorProps = {
  onRetry: () => void
}

export const RouteError = ({ onRetry }: RouteErrorProps) => (
  <div className="mx-auto flex w-full max-w-6xl flex-col px-6 py-8 lg:px-10">
    <AlertBanner
      tone="destructive"
      icon={TriangleAlertIcon}
      action={<AlertBannerAction onClick={onRetry}>Try again</AlertBannerAction>}
    >
      Something went wrong loading this page. Trying again usually fixes it.
    </AlertBanner>
  </div>
)
```

Create `src/app/(dashboard)/error.tsx`:

```tsx
'use client'

import { RouteError } from '@/components/brand/RouteError'

type DashboardErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

const DashboardError = ({ reset }: DashboardErrorProps) => <RouteError onRetry={reset} />

export default DashboardError
```

Create `src/app/settings/error.tsx` identically but with the component named
`SettingsError`.

Note: `error.message` is deliberately not rendered — unmapped errors are
infrastructure errors and their messages are not user-safe. Do not add it.

**Verify**: `pnpm lint` → exit 0. `pnpm typecheck` → exit 0.

### Step 6: `not-found.tsx` for domains and the root `global-error.tsx`

Create `src/app/(dashboard)/domains/not-found.tsx` (server component —
renders inside the dashboard shell):

```tsx
import { SearchXIcon } from 'lucide-react'
import { AlertBanner } from '@/components/brand/AlertBanner'
import { GhostButton } from '@/components/brand/GhostButton'

const DomainNotFound = () => (
  <div className="mx-auto flex w-full max-w-6xl flex-col px-6 py-8 lg:px-10">
    <AlertBanner
      tone="info"
      icon={SearchXIcon}
      action={<GhostButton href="/domains">Back to domains</GhostButton>}
    >
      That domain doesn&apos;t exist, or it belongs to a different account.
    </AlertBanner>
  </div>
)

export default DomainNotFound
```

Create `src/app/global-error.tsx`. It replaces the root layout when the root
itself fails, so the app's stylesheet may not be loaded — it must be
self-sufficient plain HTML (no Tailwind classes, no brand components), and it
must render its own `<html>`/`<body>`:

```tsx
'use client'

type GlobalErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

const GlobalError = ({ reset }: GlobalErrorProps) => (
  <html lang="en">
    <body>
      <main>
        <h1>Something went wrong</h1>
        <p>An unexpected error occurred. Try again, or reload the page.</p>
        <button type="button" onClick={reset}>
          Try again
        </button>
      </main>
    </body>
  </html>
)

export default GlobalError
```

**Verify**: `pnpm lint` → exit 0. `pnpm typecheck` → exit 0.

### Step 7: Full gate

**Verify**: `pnpm lint && pnpm typecheck && pnpm test` → all exit 0.

## Test plan

- Unit tests: step 4 (six cases in `errors.test.ts`, modeled on the existing
  `isUniqueViolation` describes in the same file).
- Contract check (manual, no code change): confirm `serviceErrorResponse`'s
  two output branches reproduce `ERROR_SHAPE_EXAMPLE` and
  `COOLDOWN_ERROR_EXAMPLE` from `src/lib/docs/apiExamples.ts:115-128` exactly.
- Boundary smoke test (manual, if a browser is available; otherwise flag for
  the reviewer): temporarily add `throw new Error('boundary test')` at the top
  of `src/app/(dashboard)/domains/page.tsx`, load `/domains`, confirm the
  branded banner with a working "Try again" appears **inside the sidebar
  shell**; then REVERT the throw before committing (`git diff` must show no
  change to `page.tsx`). Visit `/domains/<random-uuid>` and confirm the
  not-found banner renders.
- Verification: `pnpm test` → all pass.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm test` all exit 0
- [ ] `grep -c "instanceof" src/lib/http/responses.ts` → 0
- [ ] `grep -c "instanceof" src/lib/domains/actions.ts` → 2 (only `createDomainAction`'s inline pair)
- [ ] `grep -n "toErrorDetail" src/lib/domains/errors.ts src/lib/http/responses.ts src/lib/domains/actions.ts` → definition + two consumers
- [ ] These files exist: `src/app/(dashboard)/error.tsx`, `src/app/settings/error.tsx`, `src/app/(dashboard)/domains/not-found.tsx`, `src/app/global-error.tsx`, `src/components/brand/RouteError.tsx`
- [ ] `git diff -- src/lib/docs/apiExamples.ts` → empty (contract untouched)
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- Any excerpt in "Current state" no longer matches the live file — in
  particular if plan 002 landed changes to `actions.ts` beyond what's shown.
- Preserving the exact API JSON shapes proves impossible from the shared
  detail (would mean the contract analysis was wrong).
- `tsc` rejects `retryAfterMs: detail.retryAfterMs` on the optional property
  (would mean `exactOptionalPropertyTypes` was enabled since planning).
- The boundary smoke test shows `error.tsx` rendering **outside** the
  dashboard shell (would mean the layout nesting assumption is wrong — do not
  start moving files to fix it).
- Lint objects to the default exports in the new special files (these are
  Next.js-mandated defaults; if the config fights them, report rather than
  disable rules).

## Maintenance notes

- Adding a sixth error class now means: add the class, add a branch in
  `toErrorDetail`, add one test case — both surfaces pick it up. A reviewer
  should reject any future PR that adds an `instanceof` check back to
  `responses.ts` or `toActionFailure`.
- The action wire shape (nested `retryAfterMs`) and API wire shape (top-level
  `retryAfterMs`) intentionally differ; only the *source* is unified. If the
  API shape is ever versioned, update `apiExamples.ts` and
  `src/lib/docs/apiReference.ts` in the same change (audit finding DEBT-16
  proposes typing those literals — deferred, unplanned).
- Deferred: `error.tsx` for `(auth)` and `(docs)`; wiring `forbidden()` /
  `unauthorized()` conventions — not needed at current surface area.
