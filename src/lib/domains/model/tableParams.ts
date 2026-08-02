import { DOMAIN_STATUSES } from '@/lib/domains/model/status'
import type { DomainStatus } from '@/lib/domains/model/status'
import {
  INITIAL_SORT_DIRECTIONS,
  SORT_COLUMNS,
  SORT_DIRECTIONS,
} from '@/lib/domains/model/sort'
import type { SortColumn, SortDirection } from '@/lib/domains/model/sort'

export const ALL_STATUSES_FILTER = 'all'
export type StatusFilter = DomainStatus | typeof ALL_STATUSES_FILTER

export type DomainsTableParams = {
  searchQuery: string
  statusFilter: StatusFilter
  sortColumn: SortColumn | null
  sortDirection: SortDirection
}

const SEARCH_KEY = 'q'
const STATUS_KEY = 'status'
const SORT_KEY = 'sort'
const DIRECTION_KEY = 'dir'

export const DEFAULT_DOMAINS_TABLE_PARAMS: DomainsTableParams = {
  searchQuery: '',
  statusFilter: ALL_STATUSES_FILTER,
  sortColumn: null,
  sortDirection: 'asc',
}

type ReadableSearchParams = Pick<URLSearchParams, 'get'>

const parseStatusFilter = (value: string | null): StatusFilter => {
  if (value === ALL_STATUSES_FILTER) return ALL_STATUSES_FILTER
  return DOMAIN_STATUSES.find((status) => status === value) ?? ALL_STATUSES_FILTER
}

const parseSortColumn = (value: string | null): SortColumn | null =>
  SORT_COLUMNS.find((column) => column === value) ?? null

const parseSortDirection = (value: string | null, column: SortColumn | null): SortDirection => {
  const direction = SORT_DIRECTIONS.find((candidate) => candidate === value)
  if (direction) return direction
  if (column) return INITIAL_SORT_DIRECTIONS[column]
  return DEFAULT_DOMAINS_TABLE_PARAMS.sortDirection
}

export const parseDomainsTableParams = (
  searchParams: ReadableSearchParams,
): DomainsTableParams => {
  const sortColumn = parseSortColumn(searchParams.get(SORT_KEY))
  return {
    searchQuery: searchParams.get(SEARCH_KEY) ?? DEFAULT_DOMAINS_TABLE_PARAMS.searchQuery,
    statusFilter: parseStatusFilter(searchParams.get(STATUS_KEY)),
    sortColumn,
    sortDirection: parseSortDirection(searchParams.get(DIRECTION_KEY), sortColumn),
  }
}

export const serializeDomainsTableParams = (params: DomainsTableParams): string => {
  const searchParams = new URLSearchParams()
  const trimmedQuery = params.searchQuery.trim()

  if (trimmedQuery) searchParams.set(SEARCH_KEY, trimmedQuery)
  if (params.statusFilter !== ALL_STATUSES_FILTER) {
    searchParams.set(STATUS_KEY, params.statusFilter)
  }
  if (params.sortColumn) {
    searchParams.set(SORT_KEY, params.sortColumn)
    searchParams.set(DIRECTION_KEY, params.sortDirection)
  }

  return searchParams.toString()
}
