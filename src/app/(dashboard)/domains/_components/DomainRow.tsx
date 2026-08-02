'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { MouseEvent } from 'react'
import { DomainRowActions } from '@/app/(dashboard)/domains/_components/DomainRowActions'
import { StatusTag } from '@/components/brand/StatusTag'
import { Text } from '@/components/brand/Text'
import { TableCell, TableRow } from '@/components/ui/table'
import { SECTION_TABLE_CELL_CLASS as TABLE_CELL_CLASS } from '@/components/brand/Section'
import { cn } from '@/lib/utils'
import type { DomainListItem } from '@/app/(dashboard)/domains/_components/DomainsTable'
import { formatRelativeTime, formatShortDate } from '@/lib/formatTime'

const INTERACTIVE_SELECTOR = 'a, button, input, select, textarea, [role="menuitem"], [role="dialog"]'
const MIDDLE_MOUSE_BUTTON = 1
const NEW_TAB_FEATURES = 'noopener'

const hasInteractiveTarget = (target: EventTarget | null) =>
  target instanceof Element && target.closest(INTERACTIVE_SELECTOR) !== null

const hasTextSelection = () => (window.getSelection()?.toString().length ?? 0) > 0

type DomainRowProps = {
  item: DomainListItem
  nowMs: number
}

export const DomainRow = ({ item, nowMs }: DomainRowProps) => {
  const router = useRouter()
  const href = `/domains/${item.id}`
  const lastCheckedLabel = item.lastCheckedAt
    ? formatRelativeTime(item.lastCheckedAt, nowMs)
    : 'Never'

  const handleRowClick = (event: MouseEvent<HTMLTableRowElement>) => {
    if (hasInteractiveTarget(event.target) || hasTextSelection()) return
    if (event.metaKey || event.ctrlKey || event.shiftKey) {
      window.open(href, '_blank', NEW_TAB_FEATURES)
      return
    }
    router.push(href)
  }

  const handleRowAuxClick = (event: MouseEvent<HTMLTableRowElement>) => {
    if (event.button !== MIDDLE_MOUSE_BUTTON) return
    if (hasInteractiveTarget(event.target)) return
    window.open(href, '_blank', NEW_TAB_FEATURES)
  }

  return (
    <TableRow
      className="cursor-pointer border-border/40"
      onClick={handleRowClick}
      onAuxClick={handleRowAuxClick}
    >
      <TableCell className={TABLE_CELL_CLASS}>
        <Link href={href} className="outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          <Text as="span" className="font-medium">
            {item.hostname}
          </Text>
        </Link>
      </TableCell>
      <TableCell className={TABLE_CELL_CLASS}>
        <StatusTag status={item.status} />
      </TableCell>
      <TableCell className={TABLE_CELL_CLASS}>
        <Text as="span" variant="secondary">
          {formatShortDate(item.createdAt)}
        </Text>
      </TableCell>
      <TableCell className={TABLE_CELL_CLASS}>
        <Text as="span" variant="secondary">
          {lastCheckedLabel}
        </Text>
      </TableCell>
      <TableCell className={cn(TABLE_CELL_CLASS, 'text-right')}>
        <DomainRowActions domainId={item.id} hostname={item.hostname} />
      </TableCell>
    </TableRow>
  )
}
