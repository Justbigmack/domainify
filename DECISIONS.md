# Decision Record

Every non-obvious technical choice in Domainify, with the alternatives considered and why
they lost. Claims below were verified against primary sources (source code, RFCs, official
docs, npm registry data) in July 2026; key sources are linked per section.

---

## 1. Verification method: TXT record at an underscore-prefixed host

**Chosen:** TXT at `_domainify-challenge.<domain>` with value `domainify-domain-verification=<token>`.

| Option | For | Against |
|---|---|---|
| TXT at underscore host ✅ | Isolated namespace (no SPF collisions), can't conflict with CNAMEs at the claimed name, RFC 8552 convention, recommended by the IETF DNSOP [domain-verification-techniques draft](https://datatracker.ietf.org/doc/draft-ietf-dnsop-domain-verification-techniques/) | Registrar UIs that auto-append the domain create `_x.example.com.example.com` (we detect exactly this) |
| TXT at apex with value prefix (Google style) | Simplest host field (`@`) | Crowds apex TXT sets (documented "TXT bloat"); must filter by prefix |
| HTML file / meta tag | Familiar from Search Console | Proves control of a web server, not the domain; adds SSRF surface |
| Email to admin@domain | Nothing worth listing | Weak proof, mailbox-dependent |
| CNAME challenge | Nothing worth listing | Cannot coexist with other records at the same name |

Prior art for the underscore pattern: ACME's `_acme-challenge` ([RFC 8555 §8.4](https://www.rfc-editor.org/rfc/rfc8555)), Vercel's `_vercel`, GitHub's `_github-pages-challenge-<user>`, Cloudflare's `_cf-custom-hostname`.

## 2. Resolver strategy: authoritative nameservers + two DoH resolvers

**Chosen:** query the domain's authoritative nameservers directly (two distinct NS hosts,
CNAME-chased), plus Cloudflare and Google DNS-over-HTTPS (DoH, a DNS query wrapped in an
ordinary, TLS-authenticated HTTPS request) as independent corroborating views. Verified
when the authoritative servers agree, or when both public resolvers agree.

Terminology used below: *authoritative nameservers* are where a zone's records actually
live (the source of truth, updated in seconds); *recursive resolvers* (8.8.8.8, 1.1.1.1)
are the caching middlemen everyone queries in practice; DNSSEC is the optional
signature layer that lets a validating resolver detect forged DNS data.

**What industry leaders do** (from reading [Let's Encrypt Boulder's](https://github.com/letsencrypt/boulder)
`bdns/` and `va/` packages, the only CA-scale verification backend that is open source):

- Boulder queries its **own fleet of DNSSEC-validating recursive resolvers** (running
  Unbound, the open-source resolver software), never a shared public cache, per
  RFC 8555 §11.2. Fresh recursion through owned resolvers is how they avoid stale and
  negative caches.
- Since CA/Browser Forum [ballot SC-067](https://cabforum.org/2024/08/05/ballot-sc067v3-require-domain-validation-and-caa-checks-to-be-performed-from-multiple-network-perspectives-corroboration/),
  CAs must corroborate from **multiple network perspectives** (Let's Encrypt: 1 primary +
  4 remote vantage points with a quorum, ≥2 distinct internet registries) to defeat
  BGP-hijack attacks.
- Boulder scans **all** TXT records at the name and passes if any one matches, joining
  multi-part character-strings (`strings.Join(rr.Txt, "")`). We do the same.

**How that maps to a single-region product:** we cannot run resolver fleets or
multi-region vantage points. The two closest substitutes, both implemented here:

- **Authoritative-direct queries** are the only way to see a freshly created record
  instantly without owning resolvers, because public recursive caches also cache "this record
  does not exist" (negative caching, [RFC 2308](https://datatracker.ietf.org/doc/html/rfc2308)),
  for a duration set by the zone's SOA record, which is why naive "click verify again"
  flows appear broken. Classic DNS travels over UDP: single connectionless packets with
  no sender authentication, and therefore forgeable. That makes it the least-authenticated
  of our three paths, so an authoritative-only verdict queries **two distinct
  nameservers** and requires **every one that answers to return the expected value**
  (a zone exposing a single reachable nameserver still verifies on that one answer; an
  unreachable second server is not counted as disagreement). The challenge name is also
  **CNAME-chased** (bounded at 8 hops)
  because delegated verification (`_challenge` aliased via CNAME into another zone, the
  pattern Cloudflare productizes as Delegated DCV, Domain Control Validation) otherwise
  breaks: authoritative servers do not follow CNAME aliases; recursive ones do.
- **Cloudflare + Google DoH agreement** is a small-scale analog of multi-perspective
  corroboration: two independent anycast networks, TLS-authenticated transport (stronger
  against on-path attackers than our raw authoritative leg), and both are
  DNSSEC-validating, so bogus zones fail closed as SERVFAIL.

Retry cadence follows Cloudflare's published model (capped exponential,
[75 retries over 7 days](https://developers.cloudflare.com/cloudflare-for-platforms/cloudflare-for-saas/domain-support/hostname-validation/backoff-schedule/)),
scaled to our 72-hour window.

## 3. DNS lookup implementation: `node:dns` + zero-dependency DoH fetch

| Option | Authoritative queries | TTL | DNSSEC | Deps | Health (July 2026) |
|---|---|---|---|---|---|
| `node:dns` `Resolver` ✅ (authoritative leg) | Yes (UDP/53, `setServers`) | **No (TXT)** | No | 0 | Node core; full support on Vercel Node runtime |
| `fetch` → DoH JSON ✅ (public leg) | No (recursive only) | Yes | Resolver-validated, AD flag | 0 | Cloudflare/Google operated |
| `dns-packet` + `dgram` (raw wire format) | Yes | Yes | DO/AD bits | 1 | Last publish 2023-08; 17.8M/wk; hand-roll retries + TCP fallback |
| `dns2` | Yes | Yes | No validation | 0 | Solo maintainer; v3.0.0 two months old |
| `tangerine` | **No, DoH only** | Yes | AD flag | 15 | Active, but cannot reach authoritative servers: disqualified |
| `dohjs` / `native-dns` / `getdns` / shell `dig` | n/a | n/a | n/a | n/a | Dead, browser-only, or unavailable on serverless |

Trade-off accepted: `node:dns` cannot return TXT TTLs (a documented limitation; TTL
options exist only for A/AAAA). The TTL that matters for UX ("public resolvers will catch
up in N minutes") comes from the DoH answers, which we capture. The evidence-optimal
alternative, `dns-packet` over raw UDP plus RFC 8484 wire-format DoH, one codec for both
legs with full TTL/AA/AD access, is the documented upgrade path if flag-level data ever
becomes product-critical; it costs hand-rolled socket, retry, and TCP-fallback logic on a
package last published in 2023.

A subtle bug this research caught: Cloudflare's and Google's DoH JSON APIs encode
multi-chunk TXT records **differently** (Cloudflare: `"chunk1" "chunk2"`, quoted and
space-separated; Google: one seamless unquoted string). Neither format is standardized.
The parser handles both and is unit-tested against them.

## 4. Domain parsing: `tldts`

You cannot compute where a "registrable domain" begins, since `co.uk` vs `example.com` is
registry policy, not DNS structure. The industry mechanism is the
[Public Suffix List](https://publicsuffix.org/learn/) (Mozilla-initiated; consumed by
Firefox, Chromium, curl). Domainify needs it to reject claims on public suffixes
(`co.uk`), reject platform suffixes (`vercel.app`, `github.io`, via the PSL PRIVATE
section, via `allowPrivateDomains: true`), and compute apex vs subdomain.

| Package | Last publish | Weekly downloads | Notes |
|---|---|---|---|
| **tldts** ✅ | 2026-07-16 | 67.0M | PSL compiled in, refreshed via frequent automated releases; first-party TS; `isIcann`/`isPrivate`/`isIp` |
| psl | **2024-12-02** | 42.7M | Bundled PSL is ~20 months stale, a correctness bug for verification, since new platform suffixes land monthly |
| parse-domain | 2026-06-16 | 0.4M | ESM-only; requires pre-punycoded input |
| tld-extract | 2022-12-21 | 0.06M | Frozen |
| Roll your own | n/a | n/a | Re-implements PSL wildcard/exception matching + a data-refresh pipeline, minus the test suite |

Punycode/IDN needs no extra library: the WHATWG URL host parser applies UTS-46
([spec §3.5](https://url.spec.whatwg.org/#host-parsing)), so `new URL()` normalizes
`bücher.de` → `xn--bcher-kva.de` before tldts sees it.

## 5. Token generation: `crypto.randomBytes(32).toString('base64url')`

[RFC 8555 §8.3](https://www.rfc-editor.org/rfc/rfc8555#section-8.3) mandates ≥128 bits of
entropy for challenge tokens. Notably `crypto.randomUUID()` **fails that floor** (122
random bits in a v4 UUID). 32 random bytes = 256 bits, encoded base64url (DNS-TXT-safe
alphabet, 43 chars), the same shape as Google's observed `google-site-verification`
tokens. `nanoid`/`uuid` add supply-chain surface for no capability core `crypto` lacks.
Tokens are single-purpose, bound to `(user, domain)`, and expire with the pending window.

## 6. Validation: zod v4

valibot's advantage (client bundle size) and arktype's (parse speed) are irrelevant on a
backend where validation fronts DNS network round-trips; typebox routes through a separate
compiler. zod (240M weekly downloads) is already a transitive dependency, since Better Auth
depends on it, so it costs nothing, and `safeParse` gives the no-throw discriminated
union the DoH parser needs.

## 7. Data layer: Drizzle ORM on the Neon HTTP driver

| Option | Type safety | Migration DX | Better Auth fit | Verdict |
|---|---|---|---|---|
| Raw `@neondatabase/serverless` sql | None, since tagged-template rows are untyped `Record<string, any>` (verified in shipped types) | None (bolt on node-pg-migrate) | Via built-in Kysely layer | Fine for 3 queries; wrong signal here |
| Kysely | Strong (codegen *from* DB) | **No push tool exists**; hand-written up/down + regenerate types | Native, since Better Auth is Kysely inside | Connoisseur's choice; wrong iteration loop for SQL-shallow + 2 weekends |
| **Drizzle** ✅ | Strong, schema-first, inferred | `drizzle-kit push`, officially "best for rapid prototyping" | First-party adapter + CLI schema gen | Only option strong on every criterion |
| Prisma 7 | Strong (generated client) | `prisma db push` | First-party adapter | Genuinely rehabilitated (Rust engine removed, 1.6MB client, GA Neon adapter) but v7 config churn + stale-tutorial tax on a timed build |
| postgres.js / pg | Assertion-only | None | Via Kysely layer | TCP handshake cost per invocation, the exact problem Neon's HTTP driver removes |

Context that tipped it: Drizzle passed Prisma in weekly downloads this year (16.4M vs
15.1M), and the neon-http driver is first-class. Known risk, accepted and documented:
Drizzle's v1.0 RC line will replace the relational-queries API, so this project pins the
stable 0.45.x channel.

## 8. Database: Neon

Supabase free projects **pause after 7 idle days** and stay dead until manually restored
([docs](https://supabase.com/docs/guides/platform/free-project-pausing)), a broken demo
when reviewers click the link two weeks after submission. Neon scales to zero but
auto-wakes in well under a second and is never manually-paused. Turso is mid-pivot
(ground-up Rust rewrite); Railway's free tier is a 30-day trial; Fly has no free tier;
Render free cold-starts 30–60s. Vercel Postgres no longer exists (sunset June 2025,
migrated to Neon).

## 9. Auth: Better Auth with the magic-link plugin

| Option | Emails via Resend + React Email? | Verdict |
|---|---|---|
| **Better Auth** ✅ | Yes, the `sendMagicLink` callback hands you full control | v1.6.25, 6.2M weekly downloads, acquired by Vercel July 2026; DB sessions in our own schema |
| Auth.js / NextAuth | Yes | EOL by its own maintainers' words: "We strongly recommend new projects to start with Better Auth" ([announcement](https://github.com/nextauthjs/next-auth/discussions/13252)); v5 never left beta |
| Clerk | **No**, emails are delivered by Clerk's own ESP; no bring-your-own sender | Fails the requirement without webhook hacks |
| WorkOS AuthKit | Partially, BYO provider for delivery, but custom templates need webhook + API plumbing | Best hosted option; over-indirected here, identity leaves our schema |
| Supabase Auth | Via SMTP, but Go-templates not React Email | Requires a second (pausing) database |
| Roll-your-own (jose + magic-link table) | Yes | Maximal transparency, but the OWASP checklist (hashed tokens, enumeration resistance, scanner-prefetch consuming single-use links…) is long, and one miss flips the signal from "understands auth" to "shipped vulnerable auth"; too high-variance for the timeline |

Hardening applied from Better Auth's own security history (2025 open-redirect on
`/magic-link/verify`; token storage): `storeToken: 'hashed'` (the default stores
magic-link tokens **in plaintext**), strict `trustedOrigins` at deploy time, built-in
rate limits left on (5 requests/60s on magic-link routes), 5-minute single-use tokens.

### 9a. Email verification: `requireEmailVerification`, not a hand-rolled gate

Sign-up originally minted a session immediately, so any typed-in address became a working
account. Fixed with `emailAndPassword.requireEmailVerification: true` plus an
`emailVerification` block, rather than a custom gate, for three reasons that are properties
of the library rather than of our code:

- Sign-up stops returning a session (`token: null`) **and** collapses the duplicate-email
  response into a generic success, which is enumeration resistance we would otherwise hand-write.
- The unverified check runs *after* password verification, so the `sendOnSignIn` re-send is
  credential-gated. A hand-rolled "resend" endpoint keyed on email alone is an email-bombing
  vector; this one is not. `/send-verification-email` additionally carries a built-in
  3-per-60s limit, persisted through our existing `rateLimit: { storage: 'database' }`.
- The verification token is a **stateless signed JWT**, not a row, and an already-verified
  user is short-circuited straight to the callback. That makes the flow immune to the
  scanner-prefetch hazard listed above as an argument against rolling our own: Outlook Safe
  Links can GET the link first and the recipient's real click still lands correctly. It is
  also why we did not reach for single-use tokens here: replay within the TTL is the
  feature, not a gap.

| Choice | Why |
|---|---|
| TTL 1 hour | Framework default; matches the password-reset copy already shipped. A dead link costs one click to replace, since sign-in re-sends. |
| No backfill of existing rows ✅ | Every pre-existing account has `email_verified = false` and must confirm. They are never stuck: a blocked sign-in auto-sends a fresh link, and the magic-link flow sets `emailVerified = true` on use, so `/login/link` is always an escape hatch. |
| Land on `/login?verified=1`, no `autoSignInAfterVerification` | Verification usually completes in whatever browser the mail client opened, often not the one holding the session. Confirming and then asking for credentials is the honest sequence. |
| Rewrite `callbackURL` server-side | Three call sites trigger a send (sign-up, blocked sign-in, manual re-send) and only one can pass a `callbackURL` cleanly. Passing it to `signIn.email` would also set a `Location` header on *successful* sign-in and fight the client-side redirect. `src/lib/auth/emailVerification.ts` rewrites the URL Better Auth hands us, so the destination is defined exactly once and needs no extra env var. |

Known gap: without `advanced.backgroundTasks.handler`, Better Auth awaits the send inline
and swallows its error, so a Resend outage means sign-up succeeds with no email and no log.
The re-send control on `/verify-email` is the user-facing mitigation; email-send logging
across the whole app remains unbuilt (see §10 notes on silent notification failures).

## 10. Re-checks and lifecycle

Industry pattern (Google Search Console, GitHub Pages, AWS SES): verification is not
one-shot. Tokens are re-checked periodically and ownership is revoked, with
notification and a grace period, if the record disappears. Domainify mirrors this:
`pending → verified → temporary_failure (72h grace, only reachable from verified) →
failed`, with lookup errors never demoting a verified domain (a DNS outage is not
evidence the record was removed). Scheduling is check-on-read + client polling + a sweep
endpoint rather than a job queue (Inngest/QStash are the documented scale path): a queue
for zero traffic is machinery without evaluation upside. Hobby-tier Vercel cron runs at
most daily, so the sweep is driven every 5 minutes by a free external scheduler
(cron-job.org) with the daily platform cron kept as a backstop; each run claims its batch
atomically, so the per-domain backoff column is honored end to end.

## 11. Hosting: Vercel

Reviewers click take-home links days later. Render free spins down (30–60s cold start),
Railway free is a 30-day trial, Fly has no free tier. Vercel Hobby never sleeps, runs
`node:dns` in Node functions (full Node API coverage; the Edge runtime lacks it but is
deprecated), and deploys Next.js with zero config. Cloudflare Workers is the strongest
runner-up (per-minute crons, `node:dns` shimmed over DoH) at the cost of OpenNext
deployment friction.
