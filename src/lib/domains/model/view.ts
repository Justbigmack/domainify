import type { CheckSourceSnapshot, CheckTrigger, CheckVerdict } from '@/lib/dns/types'
import type { DomainStatus } from './status'

export type DomainView = {
  id: string
  hostname: string
  registrableDomain: string
  challengeHost: string
  status: DomainStatus
  createdAt: string
  tokenGeneratedAt: string
  pendingExpiresAt: string
  verifiedAt: string | null
  graceExpiresAt: string | null
  lastCheckedAt: string | null
  dnsProviderId: string | null
}

export type CheckView = {
  id: string
  checkedAt: string
  trigger: CheckTrigger
  verdict: CheckVerdict
  foundValues: string[]
  sources: CheckSourceSnapshot[]
  errorCode: string | null
}
