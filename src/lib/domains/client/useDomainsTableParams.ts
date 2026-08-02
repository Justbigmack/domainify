'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import {
  parseDomainsTableParams,
  serializeDomainsTableParams,
} from '@/lib/domains/model/tableParams'
import type { DomainsTableParams, StatusFilter } from '@/lib/domains/model/tableParams'
import type { SortColumn, SortDirection } from '@/lib/domains/model/sort'

const SEARCH_URL_SYNC_DELAY_MS = 300

export const useDomainsTableParams = () => {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const [params, setParams] = useState(() => parseDomainsTableParams(searchParams))
  const pendingWriteRef = useRef<(() => void) | null>(null)
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (syncTimerRef.current !== null) clearTimeout(syncTimerRef.current)
      pendingWriteRef.current?.()
    },
    [],
  )

  const clearPendingWrite = () => {
    if (syncTimerRef.current !== null) clearTimeout(syncTimerRef.current)
    syncTimerRef.current = null
    pendingWriteRef.current = null
  }

  const commitParams = (nextParams: DomainsTableParams, shouldDelayUrlWrite: boolean) => {
    setParams(nextParams)
    clearPendingWrite()

    const writeParamsToUrl = () => {
      if (window.location.pathname !== pathname) return
      const query = serializeDomainsTableParams(nextParams)
      window.history.replaceState(null, '', query ? `?${query}` : pathname)
    }

    if (!shouldDelayUrlWrite) {
      writeParamsToUrl()
      return
    }

    pendingWriteRef.current = writeParamsToUrl
    syncTimerRef.current = setTimeout(() => {
      clearPendingWrite()
      writeParamsToUrl()
    }, SEARCH_URL_SYNC_DELAY_MS)
  }

  const setSearchQuery = (searchQuery: string) => {
    commitParams({ ...params, searchQuery }, true)
  }

  const setStatusFilter = (statusFilter: StatusFilter) => {
    commitParams({ ...params, statusFilter }, false)
  }

  const setSort = (sortColumn: SortColumn, sortDirection: SortDirection) => {
    commitParams({ ...params, sortColumn, sortDirection }, false)
  }

  const flushSearchQuery = () => {
    const pendingWrite = pendingWriteRef.current
    clearPendingWrite()
    pendingWrite?.()
  }

  return { ...params, setSearchQuery, setStatusFilter, setSort, flushSearchQuery }
}
