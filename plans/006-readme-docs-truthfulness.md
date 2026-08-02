# Plan 006 — README & docs truthfulness pass (API keys shipped, cadence claims)

Priority: P1 · Effort: S · Depends on: 005 (soft — see Coordination) · Status: TODO

## Executor protocol (read first)

1. Read `resend-challenge-progress.md` before starting; append a session entry when
   done.
2. Verification bar: `pnpm test && pnpm lint && pnpm build` green (build matters —
   docs pages are TSX).
3. Frontend/docs-page edits: invoke `emil-design-engineering`,
   `next-best-practices`, `vercel-react-best-practices`,
   `vercel-composition-patterns` before touching any TSX. All text through the
   brand `Text`/`Heading` components — never hardcode text classes (standing
   user rule).
4. Public docs copy must not leak internals: no localhost URLs, no cookie names,
   no env-var names in `(docs)` pages (standing user rule; API examples use
   `DOCS_API_ORIGIN`-derived origins and `Bearer <api-key>` placeholders).

## Problem

The README asserts things the code outgrew. A reviewer reading it thinks the
product does less than it does, and two claims are now factually wrong:

1. **README §Authentication (lines ~85–110)** teaches session-cookie copying from
   DevTools (`better-auth.session_token`, `__Secure-…`) and says "Real API keys
   are the documented upgrade path" — but API keys shipped: plugin in
   `src/lib/auth/server.ts:36` (`apiKey({ defaultPrefix: API_KEY_PREFIX … })`,
   prefix `domainify_` from `src/lib/auth/policy.ts:2`), Bearer resolution in
   `src/lib/auth/session.ts:16–29` (`getApiKeyUser` → `auth.api.verifyApiKey`),
   management UI at `/settings/api-keys` (list, `new` creation page,
   `RevokeKeyDialog`), and `src/lib/domains/apiSnippets.ts:34` already emits
   `Authorization: Bearer` in every generated snippet.
2. **README §Deferred improvements (lines 183–197)** lists API keys as not built.
3. **README endpoint table (line ~122)**: cron row documents `200 {checkedDomains}`;
   the code returns `{checked, failed, remaining}` (service.ts:195–199) — and
   becomes `202 {started: true}` after plan 005.
4. **README line 56** "daily cron sweep" — stale after plan 005.
5. **DECISIONS.md §10** closes with "check-on-read + client polling + a daily
   Vercel cron … Hobby-tier cron runs at most daily" — needs a sentence, not a
   rewrite, once 005 lands.

## Coordination with plan 005

Items 3–5 depend on whether 005 has landed. Check the plans README status table:
- 005 DONE → write the new state (5-minute external scheduler + daily backstop,
  202 fast-ack).
- 005 not started → still fix items 1–2 now and leave 3–5 to whoever executes
  005 (its Step 6 owns them). Do not write aspirational text for unshipped
  behavior.

## Implementation steps

### Step 1 — rewrite README §Authentication

Replace the cookie-based section (keep the heading) with, in this order:

1. **API keys are the way to call the API.** Create one at Settings → API keys
   (shown once, prefixed `domainify_`), then:
   ```bash
   export DOMAINIFY_API_KEY='domainify_…'
   curl https://<app-url>/api/domains -H "Authorization: Bearer $DOMAINIFY_API_KEY"
   ```
2. Update the two worked examples at README lines ~139–150 (add-domain POST and
   verify POST) from `-b "$DOMAINIFY_COOKIE"` to the Bearer header form.
3. One sentence noting the browser app authenticates with its own session and the
   in-app `</>` panels generate ready-to-run snippets (they already carry the
   Bearer header — keep claims consistent with `apiSnippets.ts`).
4. Delete every mention of cookie names and the DevTools copy flow. Do not
   document cookie auth as an alternative; the docs area (`(docs)/docs/api`)
   already standardized on Bearer-only.
5. Keep the existing error-shape paragraph (unchanged, still accurate) — but
   re-verify its claim "requests without a valid session get 401" reads correctly
   for keys ("without a valid API key or session").

### Step 2 — rewrite README §Deferred improvements

Remove the API-keys bullet. Replace the list with what is actually not built,
each with its plan number so the section stays a truthful roadmap:

- Scoped key permissions + per-key rate limits (plan 007-adjacent — see 008).
- Webhooks (`domain.verified`, `domain.failed`) — plan 009.
- Multi-region check vantage points (MPIC-shaped quorum) — documented design in
  `resend-challenge-scale-research.md` §3.4; requires multi-region functions, so
  deferred on the free tier. Keep the existing rationale sentence about Resend's
  regions being data-locality, ours being corroboration — it's good and correct.
- Auto-configure via Domain Connect — keep existing bullet, add that Vercel and
  Cloudflare both accept templates now (email / GitHub PR) and that onboarding
  is a per-provider business process; v1 ships detection + deep links.
- If plan 005 is not yet DONE, keep a "sub-daily re-check scheduling" bullet;
  if DONE, it disappears from deferred entirely.

Do NOT reference gitignored files (`resend-challenge-*.md`, `plans/`) from the
README if the README is public-facing — check: `plans/` is committed (not
ignored), `resend-challenge-*` is ignored. Cite plan numbers only.

### Step 3 — cron row + cadence claims (only if 005 DONE — see Coordination)

- Endpoint table cron row → `202 {started: true}` + "sweeps domains whose
  `next_check_at` is due; runs every 5 minutes via an external scheduler with
  the platform daily cron as backstop".
- Line 56 architecture summary → same cadence phrasing.
- DECISIONS.md §10: append one sentence: external scheduler drives the sweep at
  5-minute cadence on the free tier; the backoff column is honored end-to-end.

### Step 4 — docs-area sweep for cadence copy

`grep -rn "daily\|30 second" "src/app/(docs)" src/app/(dashboard)/domains/_components`
and audit each hit against reality:
- `(docs)/docs/page.tsx:68` "re-checking daily" — plan 005 owns this line; if
  005 is DONE verify it changed, else leave.
- `(docs)/docs/domains/add-a-domain/page.tsx:134` "Leave the domain page open —
  it polls every 30 seconds" — accurate (poll loop base 30s, VerifySteps.tsx),
  keep.
- `VerifySteps.tsx:229` "We query your nameservers every 30 seconds." — accurate
  while the page is open; optionally sharpen to "While this page is open, we
  query your nameservers every 30 seconds." Executor's call; if changed, keep it
  inside the existing `Step` description prop.
- Also check `(docs)/docs/domains/verification/page.tsx` for cadence/backoff
  prose and confirm any numbers it states import from
  `src/lib/domains/constants.ts` / `schedule.ts` rather than being hardcoded
  (the docs area's design rule); fix by importing constants if hardcoded.

### Step 5 — verify no other stale auth copy

`grep -rn "cookie" README.md "src/app/(docs)" src/lib/domains/apiSnippets.ts` —
expected result: zero user-facing cookie-auth instructions remain (internal
Better Auth config references in `src/lib/auth/*` are fine and out of scope).

## Acceptance checklist

- [ ] README teaches Bearer-key auth only; examples runnable as written.
- [ ] Deferred list contains no shipped feature.
- [ ] Cron documentation matches the deployed response shape.
- [ ] Every docs-page cadence claim is true of the deployed behavior.
- [ ] `pnpm test && pnpm lint && pnpm build` green.

## STOP conditions

- STOP if you find the API actually rejects Bearer keys for some route (test one
  GET with a real key locally before rewriting) — that would mean a code bug,
  which outranks this docs plan; file it in the progress notes first.
- STOP on any temptation to add new features here — this plan changes prose and
  only prose (plus constant imports in docs pages per Step 4).
