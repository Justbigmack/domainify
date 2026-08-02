# Plan 008 — API key scopes (read/write) and explicit per-key rate limits

Priority: P2 · Effort: M · Depends on: none (006 references this — land before or
after, update README accordingly) · Status: TODO

## Executor protocol (read first)

1. Read `resend-challenge-progress.md` before starting; append a session entry.
2. Better Auth work: invoke `better-auth-best-practices` +
   `better-auth-security-best-practices` BEFORE writing config/auth code, and
   fetch current plugin docs via Context7 (`resolve-library-id` "better auth" →
   `query-docs` on the api-key plugin) — the plugin moved to a separate package
   `@better-auth/api-key` and its options drift between minors. Repo is on
   better-auth 1.6.25.
3. Frontend work (settings UI): invoke `emil-design-engineering`,
   `next-best-practices`, `vercel-react-best-practices`,
   `vercel-composition-patterns`. Brand typography components everywhere.
4. Verification bar: `pnpm test && pnpm lint && pnpm build` green.

## Problem

Current config (src/lib/auth/server.ts:36–40):

```ts
apiKey({
  defaultPrefix: API_KEY_PREFIX,
  startingCharactersConfig: { shouldStore: true, charactersLength: 14 },
  rateLimit: { enabled: false },
})
```

Two gaps:

1. **No rate limiting.** `enabled: false` was correct at ship time (the plugin
   default is 10 requests/DAY — an accidental outage), but the result is
   unlimited requests per key. Every surveyed vendor limits keys (Resend ~10
   req/s/team; Vercel per-operation tables, e.g. verify 100/min, claim 10/min).
2. **Every key is all-powerful.** The plugin supports per-key
   `permissions: Record<string, string[]>` verified via
   `auth.api.verifyApiKey({ body: { key, permissions } })`, but we never set or
   check them. Resend ships `full_access` / `sending_access`; we should ship
   `full access` / `read-only`.

## Design

### Scope model

One resource, two actions — deliberately minimal:

```ts
// policy.ts additions
export const API_KEY_SCOPES = ['read', 'write'] as const
export type ApiKeyScope = (typeof API_KEY_SCOPES)[number]
export const API_KEY_PERMISSIONS_FULL = { domains: ['read', 'write'] }
export const API_KEY_PERMISSIONS_READ_ONLY = { domains: ['read'] }
export const API_KEY_RATE_LIMIT_WINDOW_MS = 60 * 1000
export const API_KEY_RATE_LIMIT_MAX_REQUESTS = 120
```

Mapping: GET routes require `domains:read`; POST/DELETE routes require
`domains:write`. Cookie sessions are always full-access (scopes are a
key-holder concept).

**Legacy-key rule (important):** keys created before this plan have
`permissions = null`. Treat null as full access in our own enforcement layer —
do NOT pass `permissions` into `verifyApiKey` (the plugin rejects keys that
carry no permissions when the verify call demands some). We read
`result.key.permissions` after a plain verify and enforce in our code. This
avoids breaking Andrei's existing keys and any demo recordings.

### Enforcement layer

`getSessionUser` (src/lib/auth/session.ts:31) is used by pages, server actions,
and API routes alike, and returns `SessionUser | null`. Extending its return
type ripples everywhere, and it cannot express "rate limited" (needed for a
correct 429). So: leave `getSessionUser` exactly as-is for pages/actions, and
give API route handlers their own resolver.

New file `src/lib/auth/apiAuth.ts`:

```ts
import 'server-only'
import { headers } from 'next/headers'
import type { SessionUser } from './session'
import type { ApiKeyScope } from './policy'

export type ApiAuthResult =
  | { kind: 'user'; user: SessionUser; scopes: ApiKeyScope[] }
  | { kind: 'unauthenticated' }
  | { kind: 'forbidden'; missingScope: ApiKeyScope }
  | { kind: 'rate_limited'; retryAfterMs: number | null }

export const resolveApiRequest = async (requiredScope: ApiKeyScope): Promise<ApiAuthResult> => { … }
```

Behavior of `resolveApiRequest`:
1. Read the `authorization` header. If it is a `Bearer domainify_…` key:
   call `auth.api.verifyApiKey({ body: { key } })` once.
   - `verification.valid` false with `error.code === 'RATE_LIMITED'` →
     `{kind:'rate_limited', retryAfterMs}` (the plugin reports `tryAgainIn`;
     surface it if present, else null).
   - invalid otherwise → `{kind:'unauthenticated'}`.
   - valid → parse `verification.key.permissions` (the plugin stores a JSON
     string or object depending on version — normalize defensively; Context7
     the exact shape for 1.6.25). null/absent → scopes `['read','write']`
     (legacy full access). Then if `requiredScope` not in scopes →
     `{kind:'forbidden', missingScope: requiredScope}`; else load the owner row
     exactly as `getApiKeyUser` does today (session.ts:23–28) and return the
     user + scopes.
2. No Bearer key header → fall through to `auth.api.getSession` (cookie);
   present → full scopes; absent → unauthenticated.
3. Reuse, don't duplicate: refactor `session.ts` so the "verify key → load
   owner" core is one exported function consumed by both `getSessionUser`
   (existing behavior: any valid key = authenticated, no scope check — pages
   never mutate via bare fetches) and `resolveApiRequest`. Keep both files
   under 250 lines; if session.ts approaches the cap, `apiAuth.ts` owns the new
   logic and imports the shared core.

New response helpers in `src/lib/http/responses.ts`:

```ts
export const forbiddenResponse = (missingScope: string): NextResponse =>
  errorResponse(HTTP_FORBIDDEN, 'insufficient_scope',
    `This API key lacks the ${missingScope} scope.`)
export const rateLimitedResponse = (retryAfterMs: number | null): NextResponse => …
```

`rateLimitedResponse` mirrors the existing cooldown shape
(`{error:{code:'rate_limited',…}, retryAfterMs}`), status 429, and sets a
`Retry-After` seconds header when `retryAfterMs` is known.

### Route handler changes (mechanical)

Files: `src/app/api/domains/route.ts` (GET→read, POST→write),
`src/app/api/domains/[id]/route.ts` (GET→read, DELETE→write),
`…/[id]/verify/route.ts`, `…/[id]/restart/route.ts`,
`…/[id]/regenerate/route.ts` (all POST→write).

Pattern per handler:

```ts
const authResult = await resolveApiRequest('write')
if (authResult.kind === 'unauthenticated') return unauthorizedResponse()
if (authResult.kind === 'forbidden') return forbiddenResponse(authResult.missingScope)
if (authResult.kind === 'rate_limited') return rateLimitedResponse(authResult.retryAfterMs)
const sessionUser = authResult.user
```

Cron route untouched (secret-based). Server actions untouched (cookie sessions).

### Plugin config change

```ts
apiKey({
  defaultPrefix: API_KEY_PREFIX,
  startingCharactersConfig: { shouldStore: true, charactersLength: 14 },
  rateLimit: {
    enabled: true,
    timeWindow: API_KEY_RATE_LIMIT_WINDOW_MS,
    maxRequests: API_KEY_RATE_LIMIT_MAX_REQUESTS,
  },
})
```

Confirm via Context7 whether `timeWindow` is milliseconds in 1.6.25 (the docs
historically show ms). 120/min is deliberately generous — the goal is an abuse
floor, not throttling legitimate use; domain-verify already has its own 5s
per-domain cooldown at the service layer. Note: the plugin counts a key's
verify calls; our flow verifies once per request, so the budget maps 1:1 to
requests.

### Key creation with a scope choice

Current creation is client-side: `CreateApiKeyForm.tsx:59`
`authClient.apiKey.create({ name })`. Per plugin docs, `permissions` is
**server-only** on create — the client cannot set it. Therefore:

1. New server action `createApiKeyAction` (e.g.
   `src/lib/account/apiKeyActions.ts`, `'use server'`): validates
   `{name, scope}` with zod (`z.enum(API_KEY_SCOPES)`), requires a session via
   `getSessionUser`, then calls `auth.api.createApiKey({ body: { name,
   permissions: scope === 'write' ? API_KEY_PERMISSIONS_FULL :
   API_KEY_PERMISSIONS_READ_ONLY, userId: sessionUser.id } })` — check the
   exact server-call signature via Context7 (server-side create is keyed by
   `userId`/`referenceId`, not headers, in some versions; verify which applies
   to 1.6.25 and whether the field is `userId` or `referenceId`).
   Return `{ key }` once (never persist or log it).
2. `CreateApiKeyForm` switches from `authClient.apiKey.create` to the action via
   `useActionState` (match the pattern `createDomainAction` uses,
   src/lib/domains/actions.ts:51). Add the scope picker: two radio-style options
   ("Full access" default, "Read-only") using an existing primitive
   (`toggle-group` or `select` from components/ui) — follow the form's current
   layout conventions; handlers as `handle*` consts; no className ternaries.
3. Keys list (`/settings/api-keys` page): show a scope column/badge — derive
   from `permissions` on the listed keys (`authClient.apiKey.list` returns it;
   null → "Full access (legacy)"). Reuse `StatusTag`/badge primitives; mobile
   accordion layout must get the same field (see commit bb6e59c's mobile list).

### Docs & README

- `(docs)/docs/api` auth section: document the two scopes, the 403
  `insufficient_scope` code, and the 429 key-level `rate_limited` code alongside
  the existing per-domain cooldown 429.
- README API section: same two additions (coordinate with plan 006 — if 006 is
  DONE, edit its rewritten section; if not, note it in the 006 plan margin).

## Tests

Pure/unit (no DB harness):
- Scope parsing/normalizing helper (string JSON vs object vs null →
  `ApiKeyScope[]`): table-driven cases including legacy null → full.
- zod schema for the create action (valid scopes, rejects others).
- Response helpers: forbidden/rate-limited shapes match the error contract
  (`{error:{code,message}}` + optional `retryAfterMs`).

Manual (record in progress file):
1. Create read-only key in UI → GET /api/domains 200; POST /api/domains 403
   `insufficient_scope`; DELETE 403.
2. Full-access key → all routes work.
3. Pre-existing legacy key (create one on main before checking out the branch,
   or set `permissions` NULL in db studio) → behaves as full access.
4. Hammer any endpoint >120 req/min with one key → 429 with `Retry-After`.
5. Cookie-authenticated browser flows unaffected (add/verify/delete a domain in
   the UI end-to-end).

## Acceptance checklist

- [ ] Plugin rate limit enabled with named constants; no magic numbers.
- [ ] `resolveApiRequest` covers the four outcomes; all 7 domain route handlers
      migrated; cron route untouched.
- [ ] Scope picker in creation UI; scope visible in key list (desktop + mobile).
- [ ] Legacy keys keep working as full access.
- [ ] Docs + README updated; suite green.

## STOP conditions

- STOP if 1.6.25's `verifyApiKey` cannot return permissions without also
  enforcing them (i.e., no way to read scopes on a plain verify) — fall back to
  reading the key row via `auth.api.getApiKey` after verify, and note the extra
  round-trip in the progress file.
- STOP if server-side `createApiKey` in 1.6.25 requires headers-based session
  context and rejects `userId` — then keep client-side create for the
  full-access path and use the server action only for read-only keys ONLY if
  both paths are achievable; otherwise pause and write up options.
- Never log or store a plaintext key anywhere (including test fixtures).
