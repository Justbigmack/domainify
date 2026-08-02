import { DOMAIN_STATUSES } from '@/lib/domains/model/status'
import type { DomainStatus } from '@/lib/domains/model/status'

export type SortColumn = 'domain' | 'status' | 'created' | 'lastChecked'
export type SortDirection = 'asc' | 'desc'

export const INITIAL_SORT_DIRECTIONS: Record<SortColumn, SortDirection> = {
  domain: 'asc',
  status: 'asc',
  created: 'desc',
  lastChecked: 'desc',
}

type SortableDomainItem = {
  hostname: string
  status: DomainStatus
  createdAt: string
  lastCheckedAt: string | null
}

const DIRECTION_MULTIPLIER: Record<SortDirection, number> = { asc: 1, desc: -1 }

const compareByColumn = (
  a: SortableDomainItem,
  b: SortableDomainItem,
  column: SortColumn,
): number => {
  if (column === 'domain') return a.hostname.localeCompare(b.hostname)
  if (column === 'status') {
    return DOMAIN_STATUSES.indexOf(a.status) - DOMAIN_STATUSES.indexOf(b.status)
  }
  if (column === 'created') {
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  }
  return (
    new Date(a.lastCheckedAt ?? 0).getTime() - new Date(b.lastCheckedAt ?? 0).getTime()
  )
}

export const sortDomainItems = <Item extends SortableDomainItem>(
  items: Item[],
  column: SortColumn,
  direction: SortDirection,
): Item[] =>
  [...items].sort((a, b) => {
    if (column === 'lastChecked') {
      if (a.lastCheckedAt === null && b.lastCheckedAt === null) return 0
      if (a.lastCheckedAt === null) return 1
      if (b.lastCheckedAt === null) return -1
    }
    return compareByColumn(a, b, column) * DIRECTION_MULTIPLIER[direction]
  })
