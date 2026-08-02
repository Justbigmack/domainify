import type { DomainRow, VerificationCheckRow } from '@/db/schema'
import type { CheckView, DomainView } from '@/lib/domains/model/view'

const toIsoOrNull = (date: Date | null): string | null => (date ? date.toISOString() : null)

export const toDomainView = (domain: DomainRow): DomainView => ({
  id: domain.id,
  hostname: domain.hostname,
  registrableDomain: domain.registrableDomain,
  challengeHost: domain.challengeHost,
  status: domain.status,
  createdAt: domain.createdAt.toISOString(),
  tokenGeneratedAt: domain.tokenGeneratedAt.toISOString(),
  pendingExpiresAt: domain.pendingExpiresAt.toISOString(),
  verifiedAt: toIsoOrNull(domain.verifiedAt),
  graceExpiresAt: toIsoOrNull(domain.graceExpiresAt),
  lastCheckedAt: toIsoOrNull(domain.lastCheckedAt),
  dnsProviderId: domain.dnsProviderId,
})

export const toCheckView = (check: VerificationCheckRow): CheckView => ({
  id: check.id,
  checkedAt: check.checkedAt.toISOString(),
  trigger: check.trigger,
  verdict: check.verdict,
  foundValues: check.foundValues,
  sources: check.sources,
  errorCode: check.errorCode,
})
