import type { DomainRow, VerificationCheckRow } from '@/db/schema'
import type { CheckSourceSnapshot, CheckTrigger, CheckVerdict } from '@/lib/dns/types'
import type { DomainStatus } from '@/lib/domains/model/status'

export type ApiDomain = {
  id: string
  hostname: string
  registrableDomain: string
  challengeHost: string
  status: DomainStatus
  createdAt: string
  pendingExpiresAt: string
  verifiedAt: string | null
  graceExpiresAt: string | null
  lastCheckedAt: string | null
  nextCheckAt: string | null
  dnsProviderId: string | null
}

export type ApiCheck = {
  id: string
  domainId: string
  checkedAt: string
  trigger: CheckTrigger
  verdict: CheckVerdict
  foundValues: string[]
  sources: CheckSourceSnapshot[]
  errorCode: string | null
}

const toIsoOrNull = (date: Date | null): string | null => (date ? date.toISOString() : null)

export const toApiDomain = (domain: DomainRow): ApiDomain => ({
  id: domain.id,
  hostname: domain.hostname,
  registrableDomain: domain.registrableDomain,
  challengeHost: domain.challengeHost,
  status: domain.status,
  createdAt: domain.createdAt.toISOString(),
  pendingExpiresAt: domain.pendingExpiresAt.toISOString(),
  verifiedAt: toIsoOrNull(domain.verifiedAt),
  graceExpiresAt: toIsoOrNull(domain.graceExpiresAt),
  lastCheckedAt: toIsoOrNull(domain.lastCheckedAt),
  nextCheckAt: toIsoOrNull(domain.nextCheckAt),
  dnsProviderId: domain.dnsProviderId,
})

export const toApiCheck = (check: VerificationCheckRow): ApiCheck => ({
  id: check.id,
  domainId: check.domainId,
  checkedAt: check.checkedAt.toISOString(),
  trigger: check.trigger,
  verdict: check.verdict,
  foundValues: check.foundValues,
  sources: check.sources,
  errorCode: check.errorCode,
})
