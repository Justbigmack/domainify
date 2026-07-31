'use client'

import { useState } from 'react'
import { CheckIcon, ChevronDownIcon } from 'lucide-react'
import {
  SETTINGS_TABLE_CELL_CLASS,
  SETTINGS_TABLE_HEAD_CLASS,
  settingsTableRowClass,
} from '@/components/brand/Settings'
import { Badge } from '@/components/ui/badge'
import { CopyButton } from '@/components/brand/CopyButton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

const VALUE_HEAD_LENGTH = 24
const VALUE_TAIL_LENGTH = 8

export type RecordStatus = 'verified' | 'pending' | 'not_found'

const STATUS_LABELS: Record<RecordStatus, string> = {
  verified: 'Verified',
  pending: 'Pending',
  not_found: 'Not found',
}

const STATUS_CLASSES: Record<RecordStatus, string> = {
  verified: 'bg-success/10 text-success',
  pending: 'bg-info/10 text-info',
  not_found: 'bg-muted text-muted-foreground',
}

const VALUE_CELL_CLASS = cn(SETTINGS_TABLE_CELL_CLASS, 'font-medium tabular-nums')

const truncateMiddle = (value: string): string =>
  value.length <= VALUE_HEAD_LENGTH + VALUE_TAIL_LENGTH
    ? value
    : `${value.slice(0, VALUE_HEAD_LENGTH)}…${value.slice(-VALUE_TAIL_LENGTH)}`

type RecordCardProps = {
  recordValue: string
  recordName: string
  recordStatus?: RecordStatus | null
}

export const RecordCard = ({ recordValue, recordName, recordStatus = null }: RecordCardProps) => {
  const isVerified = recordStatus === 'verified'
  const [isCollapsed, setIsCollapsed] = useState(isVerified)

  const handleToggleCollapsed = () => {
    setIsCollapsed((current) => !current)
  }

  return (
    <div className="flex flex-col">
      {isVerified && (
        <button
          type="button"
          onClick={handleToggleCollapsed}
          aria-expanded={!isCollapsed}
          className="flex cursor-pointer items-center justify-between gap-2 px-5 py-3.5 text-sm text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
        >
          <span className="flex items-center gap-2">
            <CheckIcon className="size-4 shrink-0 text-success" />
            TXT record verified. Keep it in place to stay verified.
          </span>
          <ChevronDownIcon
            className={cn('size-4 shrink-0 transition-transform', { 'rotate-180': !isCollapsed })}
          />
        </button>
      )}
      {!isCollapsed && (
        <div className={cn('overflow-x-auto py-1', { 'border-t border-border/50': isVerified })}>
          <Table>
            <TableHeader>
              <TableRow className={settingsTableRowClass(false)}>
                <TableHead className={cn(SETTINGS_TABLE_HEAD_CLASS, 'w-20')}>Type</TableHead>
                <TableHead className={SETTINGS_TABLE_HEAD_CLASS}>Host</TableHead>
                <TableHead className={SETTINGS_TABLE_HEAD_CLASS}>Value</TableHead>
                <TableHead className={cn(SETTINGS_TABLE_HEAD_CLASS, 'w-16')}>TTL</TableHead>
                {recordStatus !== null && (
                  <TableHead className={cn(SETTINGS_TABLE_HEAD_CLASS, 'w-28')}>Status</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className={settingsTableRowClass(true)}>
                <TableCell className={cn(SETTINGS_TABLE_CELL_CLASS, 'text-muted-foreground/80')}>
                  TXT
                </TableCell>
                <TableCell className={VALUE_CELL_CLASS}>
                  <span className="inline-flex items-center gap-1.5">
                    <span>{recordName}</span>
                    <CopyButton
                      value={recordName}
                      label="Copy record host"
                      className="text-muted-foreground"
                    />
                  </span>
                </TableCell>
                <TableCell className={VALUE_CELL_CLASS}>
                  <span className="inline-flex items-center gap-1.5">
                    <span title={recordValue}>{truncateMiddle(recordValue)}</span>
                    <CopyButton
                      value={recordValue}
                      label="Copy record value"
                      className="text-muted-foreground"
                    />
                  </span>
                </TableCell>
                <TableCell className={cn(SETTINGS_TABLE_CELL_CLASS, 'text-muted-foreground')}>
                  Auto
                </TableCell>
                {recordStatus !== null && (
                  <TableCell className={SETTINGS_TABLE_CELL_CLASS}>
                    <Badge
                      variant="outline"
                      className={cn('-ml-2 border-transparent', STATUS_CLASSES[recordStatus])}
                    >
                      {STATUS_LABELS[recordStatus]}
                    </Badge>
                  </TableCell>
                )}
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
