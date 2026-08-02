import type { CheckVerdict } from '@/lib/dns/types'

export const DOMAIN_STATUSES = ['pending', 'verified', 'temporary_failure', 'failed'] as const
export type DomainStatus = (typeof DOMAIN_STATUSES)[number]

export type RecordStatus = 'verified' | 'pending' | 'not_found'

export type CheckSignal = 'found' | 'missing' | 'error'

export type TransitionContext = {
  pendingWindowExpired: boolean
  graceWindowExpired: boolean
}

export const verdictToSignal = (verdict: CheckVerdict): CheckSignal => {
  if (verdict === 'verified') return 'found'
  if (verdict === 'dns_error') return 'error'
  return 'missing'
}

export const transitionDomainStatus = (
  current: DomainStatus,
  signal: CheckSignal,
  context: TransitionContext,
): DomainStatus => {
  switch (current) {
    case 'pending':
      if (signal === 'found') return 'verified'
      if (signal === 'missing' && context.pendingWindowExpired) return 'failed'
      return 'pending'
    case 'verified':
      if (signal === 'missing') return 'temporary_failure'
      return 'verified'
    case 'temporary_failure':
      if (signal === 'found') return 'verified'
      if (signal === 'missing' && context.graceWindowExpired) return 'failed'
      return 'temporary_failure'
    case 'failed':
      return 'failed'
  }
}
