'use client'

import { useState } from 'react'
import Image from 'next/image'
import { GlobeIcon } from 'lucide-react'
import { ApiViewPanel } from '@/app/(dashboard)/domains/_components/ApiViewPanel'
import { Heading } from '@/components/brand/Heading'
import { StatusTag } from '@/components/brand/StatusTag'
import { Text } from '@/components/brand/Text'
import { BreadcrumbLink } from '@/components/brand/BreadcrumbLink'
import { DNS_PROVIDERS } from '@/lib/dns/providers'
import { formatRelativeTime, formatTimeLeft } from '@/lib/formatTime'
import type { DnsProvider } from '@/lib/dns/providers'
import type { DomainView } from '@/lib/domains/view'

const FAVICON_FETCH_SIZE = 64
const TILE_ICON_RENDER_SIZE = 24

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

const faviconUrl = (provider: DnsProvider): string =>
  `https://www.google.com/s2/favicons?domain=${provider.logoDomain}&sz=${FAVICON_FETCH_SIZE}`

const ProviderTile = ({ provider }: { provider: DnsProvider | null }) => (
  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border bg-background shadow-xs">
    {provider ? (
      <Image
        src={faviconUrl(provider)}
        alt=""
        width={TILE_ICON_RENDER_SIZE}
        height={TILE_ICON_RENDER_SIZE}
        className="size-6 rounded-sm"
      />
    ) : (
      <GlobeIcon aria-hidden strokeWidth={1.5} className="size-6 text-muted-foreground" />
    )}
  </div>
)

export const DomainHeader = ({ domain }: DomainHeaderProps) => {
  const [nowMs] = useState(() => Date.now())
  const provider = DNS_PROVIDERS.find((entry) => entry.id === domain.dnsProviderId) ?? null
  const deadline = deadlineFor(domain, nowMs)
  return (
    <header className="flex flex-col px-5">
      <div className="flex items-center justify-between gap-4">
        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5">
          <BreadcrumbLink href="/domains" label="Domains" icon={GlobeIcon} />
          <Text as="span" className="text-[0.8125rem] text-muted-foreground/60" aria-hidden>
            /
          </Text>
          <Text
            as="span"
            className="min-w-0 truncate text-[0.8125rem] font-medium text-foreground"
            title={domain.hostname}
          >
            {domain.hostname}
          </Text>
        </nav>
        <div className="-mr-3.5 shrink-0">
          <ApiViewPanel scope="domain" target={{ id: domain.id, hostname: domain.hostname }} />
        </div>
      </div>
      <div className="mt-6">
        <ProviderTile provider={provider} />
      </div>
      <div className="mt-4 flex min-w-0 items-center gap-2">
        <Heading as="h1" className="min-w-0 truncate leading-9" title={domain.hostname}>
          {domain.hostname}
        </Heading>
        <StatusTag status={domain.status} className="ml-0 shrink-0" />
      </div>
      <Text
        as="div"
        className="mt-1 flex min-w-0 items-center gap-1.5 text-muted-foreground"
        suppressHydrationWarning
      >
        <Text as="span" className="shrink-0 text-inherit">
          Added {formatRelativeTime(domain.createdAt, nowMs)}
        </Text>
        <Text as="span" className="shrink-0 text-inherit" aria-hidden>
          ·
        </Text>
        <Text as="span" className="min-w-0 truncate text-inherit">
          {provider?.displayName ?? 'No provider detected'}
        </Text>
        {deadline ? (
          <Text as="span" className="shrink-0 text-inherit tabular-nums">
            · {deadline} to verify
          </Text>
        ) : null}
      </Text>
    </header>
  )
}
