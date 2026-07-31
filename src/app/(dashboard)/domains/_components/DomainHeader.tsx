'use client'

import { useState } from 'react'
import { ApiViewPanel } from '@/components/api/ApiViewPanel'
import { Heading } from '@/components/brand/Heading'
import { StatusTag } from '@/components/brand/StatusTag'
import { Text } from '@/components/brand/Text'
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
        <Heading as="h1" className="truncate leading-9">
          Edit domain
        </Heading>
        <Text className="mt-1">
          <Text as="span" className="font-semibold break-all">
            {domain.hostname}
          </Text>
          <StatusTag status={domain.status} className="ml-2 align-middle" />
        </Text>
        <Text className="mt-0.5 text-muted-foreground" suppressHydrationWarning>
          Added {formatRelativeTime(domain.createdAt, nowMs)}
          {' · '}
          {provider?.displayName ?? 'No provider detected'}
          {deadline ? (
            <Text as="span" className="text-warning tabular-nums">
              {' '}
              · {deadline} to verify
            </Text>
          ) : null}
        </Text>
      </div>
      <div className="shrink-0">
        <ApiViewPanel scope="domain" target={{ id: domain.id, hostname: domain.hostname }} />
      </div>
    </header>
  )
}
