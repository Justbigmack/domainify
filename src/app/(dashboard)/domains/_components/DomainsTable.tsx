'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { ChangeEvent } from 'react'
import { DomainRowActions } from '@/app/(dashboard)/domains/_components/DomainRowActions'
import { DomainsMobileList } from '@/app/(dashboard)/domains/_components/DomainsMobileList'
import { SortableHead } from '@/app/(dashboard)/domains/_components/SortableHead'
import { StatusTag } from '@/components/brand/StatusTag'
import { Text } from '@/components/brand/Text'
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
} from '@/components/brand/Section'
import { cn } from '@/lib/utils'
import { DOMAIN_STATUSES } from '@/lib/domains/model/status'
import type { DomainStatus } from '@/lib/domains/model/status'
import { INITIAL_SORT_DIRECTIONS, sortDomainItems } from '@/lib/domains/model/sort'
import type { SortColumn } from '@/lib/domains/model/sort'
import { ALL_STATUSES_FILTER } from '@/lib/domains/model/tableParams'
import type { StatusFilter } from '@/lib/domains/model/tableParams'
import { useDomainsTableParams } from '@/lib/domains/client/useDomainsTableParams'
import { formatRelativeTime, formatShortDate } from '@/lib/formatTime'

export type DomainListItem = {
  id: string
  hostname: string
  status: DomainStatus
  createdAt: string
  lastCheckedAt: string | null
  graceExpiresAt: string | null
}

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
  const {
    searchQuery,
    statusFilter,
    sortColumn,
    sortDirection,
    setSearchQuery,
    setStatusFilter,
    setSort,
    flushSearchQuery,
  } = useDomainsTableParams()
  const [nowMs] = useState(() => Date.now())

  const normalizedQuery = searchQuery.trim().toLowerCase()
  const filteredItems = items.filter(
    (item) =>
      (statusFilter === ALL_STATUSES_FILTER || item.status === statusFilter) &&
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
      setSort(column, sortDirection === 'asc' ? 'desc' : 'asc')
      return
    }
    setSort(column, INITIAL_SORT_DIRECTIONS[column])
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          type="search"
          value={searchQuery}
          onChange={handleSearchChange}
          onBlur={flushSearchQuery}
          placeholder="Search domains…"
          aria-label="Search domains"
          autoComplete="off"
          spellCheck={false}
          className="flex-1 bg-card px-5 text-sm"
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
              <SelectItem value={ALL_STATUSES_FILTER}>{FILTER_LABELS.all}</SelectItem>
              {DOMAIN_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {FILTER_LABELS[status]}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <DomainsMobileList items={visibleItems} nowMs={nowMs} className="md:hidden" />
      <div className="hidden overflow-hidden rounded-xl border border-border/50 bg-card md:block">
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
                <TableCell colSpan={5} className="px-5 py-10 text-center">
                  <Text as="span" className="text-muted-foreground">
                    No domains match your filters.
                  </Text>
                </TableCell>
              </TableRow>
            ) : (
              visibleItems.map((item) => (
                <TableRow key={item.id} className="relative border-border/40">
                  <TableCell className={TABLE_CELL_CLASS}>
                    <Link
                      href={`/domains/${item.id}`}
                      className="outline-none after:absolute after:inset-0 focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      <Text as="span" className="font-medium">
                        {item.hostname}
                      </Text>
                    </Link>
                  </TableCell>
                  <TableCell className={TABLE_CELL_CLASS}>
                    <StatusTag status={item.status} />
                  </TableCell>
                  <TableCell className={TABLE_CELL_CLASS} suppressHydrationWarning>
                    <Text as="span" variant="secondary">
                      {formatShortDate(item.createdAt)}
                    </Text>
                  </TableCell>
                  <TableCell className={TABLE_CELL_CLASS} suppressHydrationWarning>
                    <Text as="span" variant="secondary">
                      {item.lastCheckedAt ? formatRelativeTime(item.lastCheckedAt, nowMs) : 'Never'}
                    </Text>
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
