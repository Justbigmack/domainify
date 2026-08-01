'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { ChangeEvent } from 'react'
import { DomainRowActions } from '@/app/(dashboard)/domains/_components/DomainRowActions'
import { DomainsMobileList } from '@/app/(dashboard)/domains/_components/DomainsMobileList'
import { SortableHead } from '@/app/(dashboard)/domains/_components/SortableHead'
import { StatusTag } from '@/components/brand/StatusTag'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  SECTION_TABLE_CELL_CLASS as TABLE_CELL_CLASS,
  SECTION_TABLE_HEAD_CLASS as TABLE_HEAD_CLASS,
} from '@/components/Section'
import { cn } from '@/lib/utils'
import { DOMAIN_STATUSES } from '@/lib/domains/status'
import type { DomainStatus } from '@/lib/domains/status'
import { INITIAL_SORT_DIRECTIONS, sortDomainItems } from '@/lib/domains/sort'
import type { SortColumn, SortDirection } from '@/lib/domains/sort'
import { formatRelativeTime, formatShortDate, formatTimeLeft } from '@/lib/formatTime'

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
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [nowMs] = useState(() => Date.now())

  const normalizedQuery = searchQuery.trim().toLowerCase()
  const filteredItems = items.filter(
    (item) =>
      (statusFilter === 'all' || item.status === statusFilter) &&
      item.hostname.includes(normalizedQuery),
  )
  const visibleItems = sortColumn
    ? sortDomainItems(filteredItems, sortColumn, sortDirection)
    : filteredItems

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value)
  }

  const handleStatusFilterChange = (value: StatusFilter | null) => {
    if (value) setStatusFilter(value)
  }

  const handleSort = (column: SortColumn) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
      return
    }
    setSortColumn(column)
    setSortDirection(INITIAL_SORT_DIRECTIONS[column])
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          type="search"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search domains…"
          aria-label="Search domains"
          className="flex-1 bg-card px-5"
        />
        <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
          <SelectTrigger
            aria-label="Filter by status"
            className="bg-card pr-4.5 text-muted-foreground"
          >
            <SelectValue>{FILTER_LABELS[statusFilter]}</SelectValue>
          </SelectTrigger>
          <SelectContent className="text-muted-foreground">
            <SelectGroup>
              <SelectItem value="all">{FILTER_LABELS.all}</SelectItem>
              {DOMAIN_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {FILTER_LABELS[status]}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <DomainsMobileList items={filteredItems} nowMs={nowMs} className="sm:hidden" />
      <div className="hidden overflow-hidden rounded-xl border border-border/50 bg-card sm:block">
        <Table>
          <TableHeader>
            <TableRow className="border-border/40 hover:bg-transparent">
              <SortableHead
                label="Domain"
                column="domain"
                activeColumn={sortColumn}
                direction={sortDirection}
                onSort={handleSort}
                className={TABLE_HEAD_CLASS}
              />
              <SortableHead
                label="Status"
                column="status"
                activeColumn={sortColumn}
                direction={sortDirection}
                onSort={handleSort}
                className={cn(TABLE_HEAD_CLASS, 'w-44')}
              />
              <SortableHead
                label="Created"
                column="created"
                activeColumn={sortColumn}
                direction={sortDirection}
                onSort={handleSort}
                className={cn(TABLE_HEAD_CLASS, 'w-36')}
              />
              <SortableHead
                label="Last checked"
                column="lastChecked"
                activeColumn={sortColumn}
                direction={sortDirection}
                onSort={handleSort}
                className={cn(TABLE_HEAD_CLASS, 'w-36')}
              />
              <TableHead className={cn(TABLE_HEAD_CLASS, 'w-24 text-right')}>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleItems.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={5} className="px-5 py-10 text-center text-muted-foreground">
                  No domains match your filters.
                </TableCell>
              </TableRow>
            ) : (
              visibleItems.map((item) => (
                <TableRow key={item.id} className="relative border-border/40">
                  <TableCell className={TABLE_CELL_CLASS}>
                    <Link
                      href={`/domains/${item.id}`}
                      className="font-medium outline-none after:absolute after:inset-0 focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      {item.hostname}
                    </Link>
                  </TableCell>
                  <TableCell className={TABLE_CELL_CLASS}>
                    <StatusTag
                      status={item.status}
                      detail={
                        item.status === 'temporary_failure' && item.graceExpiresAt
                          ? formatTimeLeft(item.graceExpiresAt, nowMs)
                          : null
                      }
                    />
                  </TableCell>
                  <TableCell
                    className={cn(TABLE_CELL_CLASS, 'text-[0.8125rem] text-muted-foreground')}
                    suppressHydrationWarning
                  >
                    {formatShortDate(item.createdAt)}
                  </TableCell>
                  <TableCell
                    className={cn(TABLE_CELL_CLASS, 'text-[0.8125rem] text-muted-foreground')}
                    suppressHydrationWarning
                  >
                    {item.lastCheckedAt ? formatRelativeTime(item.lastCheckedAt, nowMs) : '—'}
                  </TableCell>
                  <TableCell className={cn(TABLE_CELL_CLASS, 'relative text-right')}>
                    <DomainRowActions domainId={item.id} hostname={item.hostname} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
