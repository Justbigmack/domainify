# Plan 001: Make the verification baseline green (lint, typecheck script, dependency placement)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: This plan was written against commit `4ce0032`
> **plus uncommitted working-tree changes** — all "Current state" excerpts were
> taken from the live working tree on 2026-08-01, not from the commit. Do not
> rely on `git diff` against the SHA; instead, open each file cited below and
> compare it to the excerpt. On a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: dx
- **Planned at**: commit `4ce0032` (+ uncommitted working tree), 2026-08-01

## Why this matters

`pnpm lint` currently exits 1 on a clean tree because of one
`react-hooks/set-state-in-effect` error in `ThemeSelect.tsx`. Every other plan
in `plans/` uses "lint is green" as a verification gate, so nothing can be
reliably verified until this lands. While here, two small hygiene fixes: the
repo has no `typecheck` script (the documented command is the awkward
`pnpm exec tsc --noEmit`), and the `shadcn` CLI is listed under production
`dependencies` where it ships with every production install.

## Current state

This is a Next.js 16.2.11 App Router + React 19.2.4 + TypeScript (strict) app
using pnpm. Vitest runs unit tests. Repo conventions that apply here: no code
comments; no `any`; no magic numbers (use named constants); event handlers are
`const` arrow functions named with a `handle` prefix; type-only imports use
`import type`; max 250 lines per file.

Relevant files:

- `package.json` — scripts block currently:

  ```json
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "test": "vitest run",
    "db:push": "drizzle-kit push",
    "db:generate": "drizzle-kit generate",
    "db:studio": "drizzle-kit studio",
    "email:dev": "email dev --dir src/lib/emails"
  }
  ```

  and `"shadcn": "^4.16.0"` sits in `dependencies` (it is a code-generator CLI,
  used only at development time).

- `src/app/settings/_components/ThemeSelect.tsx` — the lint failure. Current
  code at lines 22-33:

  ```tsx
  export const ThemeSelect = () => {
    const { theme, setTheme } = useTheme()
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
      setIsMounted(true)
    }, [])

    const activeTheme = isMounted ? theme : 'system'
    const selectedOption =
      THEME_OPTIONS.find((option) => option.value === activeTheme) ?? THEME_OPTIONS[0]
    const preference = selectedOption.value
  ```

  The `isMounted` flag exists for a real reason: `next-themes`' `theme` value is
  unknown on the server, so rendering it before hydration causes a
  server/client mismatch. The flag defers to `'system'` until the client has
  hydrated. The fix must preserve that hydration safety while removing the
  `setState`-inside-`useEffect` pattern.

- Exact lint failure reproduced on the current tree:

  ```
  /…/src/app/settings/_components/ThemeSelect.tsx:27:5
  react-hooks/set-state-in-effect — Avoid calling setState() directly within an effect
  ✖ 1 problem (1 error, 0 warnings)
  ```

## Commands you will need

| Purpose   | Command               | Expected on success |
|-----------|-----------------------|---------------------|
| Install   | `pnpm install`        | exit 0              |
| Lint      | `pnpm lint`           | exit 0, 0 problems  |
| Typecheck | `pnpm typecheck`      | exit 0 (exists after step 1; before that use `pnpm exec tsc --noEmit`) |
| Tests     | `pnpm test`           | all pass            |

## Scope

**In scope** (the only files you should modify):
- `package.json` (and `pnpm-lock.yaml` as a side effect of `pnpm install`)
- `src/app/settings/_components/ThemeSelect.tsx`

**Out of scope** (do NOT touch, even though they look related):
- `eslint.config.mjs` — do NOT disable or downgrade the
  `react-hooks/set-state-in-effect` rule; the fix is in the component.
- `src/components/brand/ThemeProvider.tsx` and `src/lib/theme.ts` — the
  provider wiring is correct.
- Any other component using `suppressHydrationWarning` — separate concern.

## Git workflow

- Branch: `advisor/001-verification-baseline`
- Commit message style: imperative summary line, matching the repo's history
  (e.g. `Fix duplicate-domain detection: walk Error.cause chain for unique violations`).
- NEVER add `Co-Authored-By` lines or any AI attribution to commits.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Add a `typecheck` script

In `package.json`, add to `scripts` (after `"lint"`):

```json
"typecheck": "tsc --noEmit",
```

**Verify**: `pnpm typecheck` → exits 0, no errors.

### Step 2: Move `shadcn` to devDependencies

In `package.json`, move the `"shadcn": "^4.16.0"` entry from `dependencies` to
`devDependencies` (keep the same version range), then run `pnpm install` to
sync the lockfile.

**Verify**: `pnpm install` → exit 0; `grep -A30 '"devDependencies"' package.json | grep shadcn` → shows the entry; `grep -B2 -A20 '"dependencies"' package.json | grep shadcn` → no output from the `dependencies` block.

### Step 3: Fix the `set-state-in-effect` violation in ThemeSelect

Replace the `isMounted` state + effect with `useSyncExternalStore`, which is
the canonical React pattern for "has this component hydrated": the server
snapshot returns `false`, the client snapshot returns `true`, and React
guarantees the hydration render uses the server snapshot (no mismatch) before
re-rendering with the client value. No `setState`, no effect.

Target shape for `src/app/settings/_components/ThemeSelect.tsx`:

```tsx
'use client'

import { useSyncExternalStore } from 'react'
import { useTheme } from 'next-themes'
// … existing imports unchanged (remove useEffect/useState from the react import)

const subscribeToNothing = () => () => {}
const getClientSnapshot = () => true
const getServerSnapshot = () => false

export const ThemeSelect = () => {
  const { theme, setTheme } = useTheme()
  const isHydrated = useSyncExternalStore(subscribeToNothing, getClientSnapshot, getServerSnapshot)

  const activeTheme = isHydrated ? theme : 'system'
  const selectedOption =
    THEME_OPTIONS.find((option) => option.value === activeTheme) ?? THEME_OPTIONS[0]
  const preference = selectedOption.value
  // … rest of the component unchanged
```

Everything from `handlePreferenceChange` down (including the JSX) stays
exactly as it is. Do not add comments (repo convention).

**Verify**: `pnpm lint` → exit 0, 0 problems. `pnpm typecheck` → exit 0.

### Step 4: Full gate

**Verify**: `pnpm lint && pnpm typecheck && pnpm test` → all exit 0, all
existing tests pass (8 test files under `src/lib/`).

## Test plan

No new unit tests — the change is a lint-rule fix plus manifest edits, and the
component has no test harness (no component tests exist in this repo). The
regression risk is hydration behavior, which is a manual check:

- Optional manual verification (do this if you can run a browser; otherwise
  flag it for the reviewer): `pnpm dev`, sign in, open `/settings/general`,
  confirm (a) the theme select shows the currently active theme after load,
  (b) the browser console shows no hydration-mismatch warning, (c) switching
  theme still works and persists across reload.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `pnpm lint` exits 0 with 0 problems
- [ ] `pnpm typecheck` exits 0
- [ ] `pnpm test` exits 0
- [ ] `grep -n "useEffect\|useState" src/app/settings/_components/ThemeSelect.tsx` returns no matches
- [ ] `shadcn` appears only in `devDependencies`
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- `ThemeSelect.tsx` no longer matches the excerpt above (drifted).
- After the `useSyncExternalStore` change, `pnpm lint` reports a *different*
  rule violation in this file that you cannot fix by following the target
  shape exactly.
- Fixing the lint error appears to require `suppressHydrationWarning`,
  disabling a lint rule, or touching `ThemeProvider` — those mean the
  approach doesn't fit and the advisor should re-plan.
- `pnpm install` fails or wants to change unrelated lockfile entries beyond
  moving `shadcn`.

## Maintenance notes

- Other components in this repo defer time-dependent rendering with
  `suppressHydrationWarning` (e.g. `DomainsTable.tsx`, `DomainHeader.tsx`).
  If a future lint upgrade flags those, the `useSyncExternalStore` hydration
  pattern introduced here is the repo's precedent to follow.
- Reviewer should scrutinize: that the select still renders `System` on first
  paint and snaps to the real theme immediately after hydration, with no
  console warning.
- Deferred: adding a CI job that runs `lint`/`typecheck`/`test` — out of this
  plan's scope; a `.github/` workflow already exists and was not audited.
