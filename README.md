# Domainify

Prove you own a domain — and understand every step of the process.

Domainify is a take-home project for Resend's product engineer challenge: a full-stack
TypeScript app where you add a domain you own, place one DNS TXT record, and watch
verification happen live — with clear diagnostics when something goes wrong and a
guided path to recovery.

## How verification works

1. Add a domain. Domainify generates a single-purpose 256-bit token bound to your account.
2. Create a TXT record at `_domainify-challenge.<your-domain>` with the value
   `domainify-domain-verification=<token>`.
3. Domainify queries your domain's **authoritative nameservers** directly (plus
   Cloudflare and Google public resolvers for a propagation view), so a freshly added
   record is detected in seconds — no "wait up to 48 hours".

Domain lifecycle: `pending → verified`, with `temporary_failure` (grace period) when a
verified record disappears and `failed` after the 72-hour window expires — recoverable
via an explicit restart.

## Stack

- Next.js (App Router) on Vercel
- Neon Postgres + Drizzle ORM
- Better Auth magic-link sign-in, emails via Resend + React Email
- `node:dns` + DNS-over-HTTPS for lookups, `tldts` for public-suffix validation

## Local development

```bash
pnpm install
cp .env.example .env   # fill in real values
pnpm db:push           # sync schema to your Neon database
pnpm dev
```

Environment variables (see `.env.example`): `DATABASE_URL` (Neon), `BETTER_AUTH_SECRET`,
`BETTER_AUTH_URL`, `RESEND_API_KEY`, `EMAIL_FROM`, `CRON_SECRET`.

```bash
pnpm test              # unit tests (normalization, state machine, record matching)
pnpm email:dev         # preview email templates
```
