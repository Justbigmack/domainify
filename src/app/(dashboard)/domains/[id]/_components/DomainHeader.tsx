'use client'

import Image from 'next/image'
import { GlobeIcon } from 'lucide-react'
import { ApiViewPanel } from '@/lib/apiSurface/_components/ApiViewPanel'
import { Heading } from '@/components/brand/Heading'
import { StatusTag } from '@/components/brand/StatusTag'
import { Text } from '@/components/brand/Text'
import {
  Breadcrumb,
  BreadcrumbCurrent,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from '@/components/brand/Breadcrumb'
import { DNS_PROVIDERS } from '@/lib/dns/providers'
import { formatRelativeTime, formatTimeLeft } from '@/lib/formatTime'
import { deadlineAtFor } from '@/lib/domains/model/view'
import type { DnsProvider } from '@/lib/dns/providers'
import type { DomainView } from '@/lib/domains/model/view'

const FAVICON_FETCH_SIZE = 64
const TILE_ICON_RENDER_SIZE = 24

type DomainHeaderProps = {
  domain: DomainView
  nowMs: number
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

export const DomainHeader = ({ domain, nowMs }: DomainHeaderProps) => {
  const deadlineAt = deadlineAtFor(domain)
  const provider = DNS_PROVIDERS.find((entry) => entry.id === domain.dnsProviderId) ?? null
  const deadline = deadlineAt === null ? null : formatTimeLeft(deadlineAt, nowMs)
  return (
    <header className="flex flex-col px-5">
      <div className="flex min-h-9 items-center justify-between gap-4">
        <Breadcrumb>
          <BreadcrumbLink href="/domains" label="Domains" icon={GlobeIcon} />
          <BreadcrumbSeparator />
          <BreadcrumbCurrent label={domain.hostname} />
        </Breadcrumb>
        <div className="-mr-3.5 shrink-0">
          <ApiViewPanel scope="domain" domainId={domain.id} />
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
      <Text as="div" className="mt-1 flex min-w-0 items-center gap-1.5 text-muted-foreground">
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
