# Plan 009 — Outbound webhooks (domain lifecycle events) via Svix free tier

Priority: P3 · Effort: M · Depends on: none (007 touches the same `runCheck`
lines — rebase whichever lands second) · Status: TODO

## Executor protocol (read first)

1. Read `resend-challenge-progress.md` before starting; append a session entry.
2. Fetch current Svix API docs via Context7 (`resolve-library-id` "svix" →
   `query-docs`) before writing any Svix call — method names below are from
   docs research dated 2026-08-01 and must be re-verified against the installed
   SDK version.
3. Frontend work (settings surface): invoke `emil-design-engineering`,
   `next-best-practices`, `vercel-react-best-practices`,
   `vercel-composition-patterns`. Brand typography components; no hardcoded text
   classes.
4. Docs pages: no internal leakage (no env names, no localhost).
5. Verification bar: `pnpm test && pnpm lint && pnpm build` green.

## Why

An API client that `POST`s a domain and the TXT record has no way to learn the
outcome except polling `GET /api/domains/:id`. Every surveyed vendor ships domain
webhooks (Resend `domain.updated` on Svix infrastructure; Vercel
`project.domain.verified`/`unverified`; Cloudflare notifications) — see
`resend-challenge-scale-research.md` §2 and §3.2. Buying delivery from Svix
(free tier: 50,000 msgs/mo, 8-attempt retry ladder over ~27h, endpoint
auto-disable, signature scheme = Standard Webhooks, hosted consumer portal)
removes the entire hard part: retries, DLQ semantics, endpoint CRUD UI, secret
rotation.

## Provisioning (blocked on Andrei, ~10 min)

1. Create a free Svix account → one Svix **environment** → copy the API key.
2. Vercel env + `.env` + `.env.example`: `SVIX_TOKEN`. Absence of the var must
   disable the feature gracefully (no-op publisher, settings page shows an
   "unconfigured" empty state) so dev/preview environments work without it.

## Design

### Event catalog (v1 — state-machine edges only)

| Event type | Fires when | Source location |
|---|---|---|
| `domain.verified` | status transitions into `verified` from any other status | `runCheck` (checks.ts) — existing `becameVerified` |
| `domain.temporary_failure` | `verified → temporary_failure` | `runCheck` — existing `enteredGrace` |
| `domain.failed` | any status → `failed` | `runCheck` — new `becameFailed` |
| `domain.restarted` | failed → pending via restart | `restartVerification` (service.ts:143) |

Not in v1: `domain.created`/`deleted` (the caller performed the action — they
already know) and per-check events (too chatty; the audit log serves that).
Listing the omission in the docs page is part of this plan.

### Payload — envelope mirroring Resend's shape

```json
{
  "type": "domain.verified",
  "created_at": "2026-08-02T12:34:56.000Z",
  "data": { …DomainView… }
}
```

`data` is exactly `toDomainView(domain)` from `src/lib/domains/view.ts` — the
same serializer the API returns, so no new leakage surface and no drift. Build
the envelope in a pure function (unit-testable):
`buildDomainEventPayload(type, domain, occurredAt)`.

### Svix object mapping

- One Svix **application per user**, `uid = user.id`, lazily ensured
  (`applicationCreate` with idempotent uid — verify exact SDK call; historically
  `svix.application.create({ uid, name })` upserts on uid or requires
  get-or-create; Context7 it).
- `svix.message.create(appUid, { eventType, eventId, payload })` with
  **`eventId` = `${type}:${check.id}`** for `runCheck` events (checks are
  unique per transition) and `${type}:${domain.id}:${domain.tokenGeneratedAt
  ISO}` for `domain.restarted` — Svix dedupes on eventId, giving exactly-once
  per transition even if `after()` retries.
- Event types: register the four types in the Svix dashboard (name +
  description) so the consumer portal renders them; note in progress file.

### New module `src/lib/webhooks/publish.ts`

```ts
import 'server-only'
```

Exports:
- `buildDomainEventPayload(type, domain, occurredAt)` — pure.
- `publishDomainEvent(input: { userId, type, domain, eventId })` — no-ops when
  `process.env.SVIX_TOKEN` is unset; otherwise ensure-app + message.create;
  catches and `console.error`s every Svix failure (delivery is Svix's job;
  publish failure must never break a check). Singleton Svix client via a
  module-level lazy init.
- `DOMAIN_EVENT_TYPES` const (the four strings, `as const`) — imported by the
  docs page so the docs cannot drift (matches the docs-area design rule).

Package: `pnpm add svix`. Keep the file under 250 lines (trivially will be).

### Emission points

1. `src/lib/domains/checks.ts` — `runCheck` already computes `becameVerified`
   and `enteredGrace` (lines 107–108) and defers `notifyOwner` via `after()`
   (line 125–127). Add `becameFailed = nextStatus === 'failed' &&
   domain.status !== 'failed'`. Extend the existing `after()` block (or a
   sibling one) to call `publishDomainEvent` for whichever of the three edges
   fired, with `eventId` derived from the inserted `check.id`. Keep email logic
   untouched. **Coordinate with plan 007, which edits line 114 of this file.**
2. `src/lib/domains/service.ts` — `restartVerification`: after the update
   returns, `after(() => publishDomainEvent({ …, type: 'domain.restarted',
   domain: updated, eventId: … }).catch(() => undefined))`. `service.ts` is at
   ~223 lines; this addition must keep it under 250 — if tight, move the
   `after()` wrapper into `publish.ts` (`publishDomainEventDeferred`).

### Consumer-facing surface

1. **Settings page** `src/app/(dashboard)/settings/webhooks/page.tsx` following
   the existing settings layout/section conventions (`Section` compound, see
   settings/_components): short explainer, list of the four event types, and a
   primary "Manage endpoints" button. The button hits a server action that calls
   Svix **App Portal** access (`svix.authentication.appPortalAccess(appUid,
   {})` → one-time magic URL, ~week expiry — verify call name via Context7)
   and redirects. Endpoint CRUD, secrets, delivery logs, and manual retries all
   live in the portal — build zero CRUD UI ourselves. Add the nav item to the
   settings sidebar (see how `api-keys` is registered in the settings layout /
   sidebar config).
   Unconfigured state (`SVIX_TOKEN` unset): render the explainer plus a muted
   "Webhooks are not configured in this environment" line instead of the button.
2. **Docs page** `(docs)/docs/webhooks` (or a section under the API docs —
   follow the docs sidebar structure in `(docs)/docs/_lib`): event catalog
   imported from `DOMAIN_EVENT_TYPES`, the envelope shape with a real example
   payload, and signature verification instructions per **Standard Webhooks**
   (headers `svix-id`/`svix-timestamp`/`svix-signature`, HMAC-SHA256 over
   `id.timestamp.rawBody`, `whsec_` secret) with a short Node verification
   snippet using the `svix` library. State the at-least-once + unordered
   delivery semantics and the retry ladder.

## Tests

- `buildDomainEventPayload`: envelope shape, ISO timestamp, `data` equals
  `toDomainView` output (reuse an existing DomainRow fixture if one exists in
  the test files; else construct one inline as other tests do).
- Edge derivation: a small pure helper `domainEventForTransition(previousStatus,
  nextStatus)` → `'domain.verified' | 'domain.temporary_failure' |
  'domain.failed' | null` — implement emission via this helper so the matrix is
  unit-testable (all 4×4 status pairs; only the three edges return non-null;
  `verified → verified` and `temporary_failure → verified` both map to
  `domain.verified`? — decision: `temporary_failure → verified` DOES fire
  `domain.verified` (recovery is news); `verified → verified` does not. Encode
  exactly the existing `becameVerified` semantics: fire iff `next === 'verified'
  && previous !== 'verified'`).
- No live Svix calls in tests: `publishDomainEvent` with `SVIX_TOKEN` unset must
  return without importing/instantiating the client (assert no throw).

## Manual verification (record in progress file)

1. With `SVIX_TOKEN` set locally: add a test endpoint in the Svix portal
   (Svix Play URL works for a disposable receiver), run a real verify flow on a
   test domain → `domain.verified` arrives, signature checks out.
2. Delete the TXT record, force a check → `domain.temporary_failure` arrives.
3. Unset `SVIX_TOKEN`, restart dev → checks still work; settings page shows the
   unconfigured state.
4. Confirm no duplicate messages on a double-fired check (same check.id →
   Svix dedupe).

## Acceptance checklist

- [ ] Four events fire on exactly their state edges; none fire without a
      transition; email behavior unchanged.
- [ ] Zero webhook code in the request/response path — everything under
      `after()` with error swallowing.
- [ ] Settings page + sidebar entry + docs page live; docs import the event
      catalog from code.
- [ ] Feature degrades to no-op without `SVIX_TOKEN`.
- [ ] Suite green; no plaintext secrets in the repo.

## STOP conditions

- STOP if the Svix free tier now requires a card or has dropped below our needs
  (check at signup) — do not silently switch to self-rolled delivery; the
  self-roll design (QStash + DLQ + Standard Webhooks signing) is specced in
  `resend-challenge-scale-research.md` §3.2 as a separate future plan.
- STOP if `after()` inside `runCheck` context is unavailable where
  `restartVerification` runs (server action context) — verify with the bundled
  Next docs; fall back to awaiting the publish (it's fire-and-forget-fast) with
  a `.catch`, and note the deviation.
- STOP if adding the settings nav item requires touching the shared sidebar in a
  way that affects `/docs` or the dashboard shell beyond adding one entry —
  flag first (the plans README notes the three-shell duplication as a known
  refactor trap).
