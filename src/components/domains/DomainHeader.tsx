'use client'

import { useState } from 'react'
import { ApiViewPanel } from '@/components/api/ApiViewPanel'
import { StatusTag } from '@/components/brand/StatusTag'
import { BreadcrumbLink } from '@/components/shell/BreadcrumbLink'
import { DNS_PROVIDERS } from '@/lib/dns/providers'
import { formatRelativeTime, formatTimeLeft } from '@/lib/formatTime'
import type { DomainView } from '@/lib/domains/view'

type DomainHeaderProps = {
  domain: DomainView
}

const deadlineFor = (domain: DomainView, nowMs: number): string | null => {
  if (domain.status === 'pending') {
    return formatTimeLeft(domain.pendingExpiresAt, nowMs)
  }
  if (domain.status === 'temporary_failure' && domain.graceExpiresAt) {
    return formatTimeLeft(domain.graceExpiresAt, nowMs)
  }
  return null
}

export const DomainHeader = ({ domain }: DomainHeaderProps) => {
  const [nowMs] = useState(() => Date.now())
  const provider = DNS_PROVIDERS.find((entry) => entry.id === domain.dnsProviderId)
  const deadline = deadlineFor(domain, nowMs)
  return (
    <header className="flex items-start justify-between gap-4 px-5">
      <div className="min-w-0">
        <div>
          <BreadcrumbLink href="/domains" label="Domains" />
        </div>
        <h1 className="truncate text-2xl leading-9 font-medium">Edit domain</h1>
        <p className="mt-1 text-sm">
          <span className="font-semibold break-all">{domain.hostname}</span>
          <StatusTag status={domain.status} className="ml-2 align-middle" />
        </p>
        <p className="mt-0.5 text-sm text-muted-foreground" suppressHydrationWarning>
          Added {formatRelativeTime(domain.createdAt, nowMs)}
          {' · '}
          {provider?.displayName ?? 'No provider detected'}
          {deadline ? (
            <span className="text-warning tabular-nums"> · {deadline} to verify</span>
          ) : null}
        </p>
      </div>
      <div className="shrink-0">
        <ApiViewPanel scope="domain" target={{ id: domain.id, hostname: domain.hostname }} />
      </div>
    </header>
  )
}
