import { after } from 'next/server'
import { and, count, eq, gte } from 'drizzle-orm'
import { db } from '@/db'
import { user } from '@/db/authSchema'
import { domains, verificationChecks } from '@/db/schema'
import type { DomainRow, VerificationCheckRow } from '@/db/schema'
import { checkDomainOwnership } from '@/lib/dns/check'
import type { DomainCheckSources } from '@/lib/dns/check'
import type { NormalizedDomain } from '@/lib/dns/normalize'
import type { CheckSourceSnapshot, CheckTrigger, TxtLookup, TxtLookupSource } from '@/lib/dns/types'
import { sendDomainVerifiedEmail, sendGraceWarningEmail } from '@/lib/emails/sendDomainEmail'
import { GRACE_WINDOW_MS } from '@/lib/domains/model/constants'
import { computeNextCheckAt } from '@/lib/domains/model/schedule'
import { transitionDomainStatus, verdictToSignal } from '@/lib/domains/model/status'

export type CheckRunResult = {
  domain: DomainRow
  check: VerificationCheckRow
}

const toSnapshot = (
  source: TxtLookupSource,
  lookup: TxtLookup | null,
): CheckSourceSnapshot | null =>
  lookup === null
    ? null
    : {
        source,
        kind: lookup.kind,
        values: lookup.kind === 'records' ? lookup.values : [],
        minTtlSeconds: lookup.kind === 'records' ? lookup.minTtlSeconds : null,
        errorCode: lookup.kind === 'lookup_error' ? lookup.code : null,
      }

const buildSnapshots = (sources: DomainCheckSources): CheckSourceSnapshot[] =>
  [
    toSnapshot('authoritative', sources.authoritative),
    toSnapshot('doh_cloudflare', sources.cloudflare),
    toSnapshot('doh_google', sources.google),
  ].filter((snapshot): snapshot is CheckSourceSnapshot => snapshot !== null)

const firstErrorCode = (snapshots: CheckSourceSnapshot[]): string | null =>
  snapshots.find((snapshot) => snapshot.errorCode !== null)?.errorCode ?? null

const toNormalizedDomain = (domain: DomainRow): NormalizedDomain => ({
  hostname: domain.hostname,
  registrableDomain: domain.registrableDomain,
  isApex: domain.hostname === domain.registrableDomain,
  challengeHost: domain.challengeHost,
})

const countChecksForCurrentToken = async (domain: DomainRow): Promise<number> => {
  const [row] = await db
    .select({ value: count() })
    .from(verificationChecks)
    .where(
      and(
        eq(verificationChecks.domainId, domain.id),
        gte(verificationChecks.checkedAt, domain.tokenGeneratedAt),
      ),
    )
  return row?.value ?? 0
}

const notifyOwner = async (domain: DomainRow, updated: DomainRow): Promise<void> => {
  const [owner] = await db
    .select({ email: user.email })
    .from(user)
    .where(eq(user.id, domain.userId))
  if (!owner) return
  if (updated.status === 'verified' && domain.status !== 'verified') {
    await sendDomainVerifiedEmail({ recipientEmail: owner.email, hostname: domain.hostname })
  }
  if (updated.status === 'temporary_failure' && domain.status === 'verified') {
    await sendGraceWarningEmail({
      recipientEmail: owner.email,
      hostname: domain.hostname,
      graceExpiresAt: updated.graceExpiresAt,
    })
  }
}

export const runCheck = async (
  domain: DomainRow,
  trigger: CheckTrigger,
): Promise<CheckRunResult> => {
  const checkedAt = new Date()
  const result = await checkDomainOwnership(toNormalizedDomain(domain), domain.verificationToken)
  const snapshots = buildSnapshots(result.sources)
  const [check] = await db
    .insert(verificationChecks)
    .values({
      domainId: domain.id,
      checkedAt,
      trigger,
      verdict: result.verdict,
      foundValues: result.foundValues,
      sources: snapshots,
      errorCode: firstErrorCode(snapshots),
    })
    .returning()
  const nextStatus = transitionDomainStatus(domain.status, verdictToSignal(result.verdict), {
    pendingWindowExpired: checkedAt > domain.pendingExpiresAt,
    graceWindowExpired: domain.graceExpiresAt !== null && checkedAt > domain.graceExpiresAt,
  })
  const attemptCount = await countChecksForCurrentToken(domain)
  const becameVerified = nextStatus === 'verified' && domain.status !== 'verified'
  const enteredGrace = nextStatus === 'temporary_failure' && domain.status === 'verified'
  const [updated] = await db
    .update(domains)
    .set({
      status: nextStatus,
      lastCheckedAt: checkedAt,
      nextCheckAt: computeNextCheckAt(nextStatus, attemptCount, checkedAt),
      dnsProviderId: result.provider?.id ?? domain.dnsProviderId,
      verifiedAt: becameVerified ? checkedAt : domain.verifiedAt,
      graceExpiresAt: enteredGrace
        ? new Date(checkedAt.getTime() + GRACE_WINDOW_MS)
        : nextStatus === 'verified'
          ? null
          : domain.graceExpiresAt,
    })
    .where(eq(domains.id, domain.id))
    .returning()
  if (becameVerified || enteredGrace) {
    after(() => notifyOwner(domain, updated).catch(() => undefined))
  }
  return { domain: updated, check }
}
