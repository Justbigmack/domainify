'use client'

import { useState } from 'react'
import { StatusPill } from '@/components/domains/status-pill'
import { DNS_PROVIDERS } from '@/lib/dns/providers'
import { formatRelativeTime, formatTimeLeft } from '@/lib/format-time'
import type { DomainView } from '@/lib/domains/view'

type MetaRowProps = {
  domain: DomainView
}

const deadlineFor = (domain: DomainView, nowMs: number): { label: string; value: string } | null => {
  if (domain.status === 'pending') {
    const timeLeft = formatTimeLeft(domain.pendingExpiresAt, nowMs)
    return timeLeft ? { label: 'Verify within', value: timeLeft } : null
  }
  if (domain.status === 'temporary_failure' && domain.graceExpiresAt) {
    const timeLeft = formatTimeLeft(domain.graceExpiresAt, nowMs)
    return timeLeft ? { label: 'Restore within', value: timeLeft } : null
  }
  return null
}

export const MetaRow = ({ domain }: MetaRowProps) => {
  const [nowMs] = useState(() => Date.now())
  const provider = DNS_PROVIDERS.find((entry) => entry.id === domain.dnsProviderId)
  const deadline = deadlineFor(domain, nowMs)
  return (
    <dl className="flex flex-wrap gap-x-10 gap-y-4">
      <div className="flex flex-col gap-1">
        <dt className="text-xs font-medium tracking-wide text-ink-subtle uppercase">Created</dt>
        <dd className="text-sm" suppressHydrationWarning>
          {formatRelativeTime(domain.createdAt, nowMs)}
        </dd>
      </div>
      <div className="flex flex-col gap-1">
        <dt className="text-xs font-medium tracking-wide text-ink-subtle uppercase">Status</dt>
        <dd>
          <StatusPill status={domain.status} />
        </dd>
      </div>
      <div className="flex flex-col gap-1">
        <dt className="text-xs font-medium tracking-wide text-ink-subtle uppercase">Provider</dt>
        <dd className="text-sm">{provider?.displayName ?? '—'}</dd>
      </div>
      {deadline && (
        <div className="flex flex-col gap-1">
          <dt className="text-xs font-medium tracking-wide text-ink-subtle uppercase">
            {deadline.label}
          </dt>
          <dd className="text-sm font-medium text-warning tabular-nums" suppressHydrationWarning>
            {deadline.value}
          </dd>
        </div>
      )}
    </dl>
  )
}
