'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { ChangeEvent } from 'react'
import { ChevronRightIcon, SearchIcon } from '@/components/icons'
import { StatusPill } from '@/components/domains/status-pill'
import { cn } from '@/lib/cn'
import { DOMAIN_STATUSES } from '@/lib/domains/status'
import type { DomainStatus } from '@/lib/domains/status'
import { formatRelativeTime, formatTimeLeft } from '@/lib/format-time'

export type DomainListItem = {
  id: string
  hostname: string
  status: DomainStatus
  createdAt: string
  lastCheckedAt: string | null
  graceExpiresAt: string | null
}

type StatusFilter = DomainStatus | 'all'

const FILTER_LABELS: Record<StatusFilter, string> = {
  all: 'All statuses',
  pending: 'Pending',
  verified: 'Verified',
  temporary_failure: 'Record missing',
  failed: 'Failed',
}

type DomainsTableProps = {
  items: DomainListItem[]
}

export const DomainsTable = ({ items }: DomainsTableProps) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [nowMs] = useState(() => Date.now())

  const normalizedQuery = searchQuery.trim().toLowerCase()
  const filteredItems = items.filter(
    (item) =>
      (statusFilter === 'all' || item.status === statusFilter) &&
      item.hostname.includes(normalizedQuery),
  )

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value)
  }

  const handleStatusFilterChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(event.target.value as StatusFilter)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-subtle" />
          <input
            type="search"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search domains…"
            aria-label="Search domains"
            className="h-10 w-full rounded-lg border border-border bg-surface pr-3 pl-9 text-base text-ink placeholder:text-ink-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus sm:text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={handleStatusFilterChange}
          aria-label="Filter by status"
          className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          <option value="all">{FILTER_LABELS.all}</option>
          {DOMAIN_STATUSES.map((status) => (
            <option key={status} value={status}>
              {FILTER_LABELS[status]}
            </option>
          ))}
        </select>
      </div>
      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs tracking-wide text-ink-subtle uppercase">
              <th scope="col" className="px-4 py-3 font-medium">
                Domain
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Status
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Created
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Last checked
              </th>
              <th scope="col" className="w-10 px-4 py-3" aria-label="Open" />
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-ink-muted">
                  No domains match your filters.
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => (
                <tr
                  key={item.id}
                  className={cn(
                    'relative border-b border-border transition-colors last:border-b-0',
                    'hover:bg-surface-muted/50',
                  )}
                >
                  <td className="px-4 py-3.5">
                    <Link
                      href={`/domains/${item.id}`}
                      className="font-mono text-sm font-medium after:absolute after:inset-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                    >
                      {item.hostname}
                    </Link>
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusPill
                      status={item.status}
                      detail={
                        item.status === 'temporary_failure' && item.graceExpiresAt
                          ? formatTimeLeft(item.graceExpiresAt, nowMs)
                          : null
                      }
                    />
                  </td>
                  <td className="px-4 py-3.5 text-ink-muted" suppressHydrationWarning>
                    {formatRelativeTime(item.createdAt, nowMs)}
                  </td>
                  <td className="px-4 py-3.5 text-ink-muted" suppressHydrationWarning>
                    {item.lastCheckedAt ? formatRelativeTime(item.lastCheckedAt, nowMs) : '—'}
                  </td>
                  <td className="px-4 py-3.5 text-ink-subtle">
                    <ChevronRightIcon className="size-4" />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
