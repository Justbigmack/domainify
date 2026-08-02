'use client'

import { ArrowUpIcon, ChevronsUpDownIcon } from 'lucide-react'
import { TableHead } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import type { SortColumn, SortDirection } from '@/lib/domains/model/sort'

type AriaSortValue = 'ascending' | 'descending' | 'none'

type SortableHeadProps = {
  label: string
  column: SortColumn
  activeColumn: SortColumn | null
  direction: SortDirection
  onSort: (column: SortColumn) => void
  className?: string
}

export const SortableHead = ({
  label,
  column,
  activeColumn,
  direction,
  onSort,
  className,
}: SortableHeadProps) => {
  const isActive = column === activeColumn
  let ariaSort: AriaSortValue = 'none'
  if (isActive) ariaSort = direction === 'asc' ? 'ascending' : 'descending'

  const handleClick = () => {
    onSort(column)
  }

  return (
    <TableHead aria-sort={ariaSort} className={className}>
      <button
        type="button"
        onClick={handleClick}
        className="group inline-flex items-center gap-1 rounded-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {label}
        {isActive ? (
          <ArrowUpIcon
            aria-hidden="true"
            className={cn(
              'size-3 transition-transform duration-150 ease-out motion-reduce:transition-none',
              { 'rotate-180': direction === 'desc' },
            )}
          />
        ) : (
          <ChevronsUpDownIcon
            aria-hidden="true"
            className="size-3 opacity-50 transition-opacity duration-150 ease-out group-hover:opacity-100 motion-reduce:transition-none"
          />
        )}
      </button>
    </TableHead>
  )
}
