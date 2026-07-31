'use client'

import { useState } from 'react'
import { CheckIcon, TriangleAlertIcon, XIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatRelativeTime } from '@/lib/format-time'
import type { DomainEvent, DomainEventKey } from '@/lib/domains/insights'
import type { DomainStatus } from '@/lib/domains/status'

const BANNER_CONFIG: Record<DomainStatus, { className: string; message: string }> = {
  pending: {
    className: 'bg-info/10 text-info',
    message:
      'Waiting for your DNS record. We check automatically, so leave the record in place once added.',
  },
  verified: {
    className: 'bg-success/10 text-success',
    message: 'Domain verified: ownership is proven. Keep the record in place to stay verified.',
  },
  temporary_failure: {
    className: 'bg-warning/10 text-warning',
    message:
      'We can no longer find your record. Restore it before the grace deadline to keep verified status.',
  },
  failed: {
    className: 'bg-destructive/10 text-destructive',
    message: "We couldn't verify ownership within the window. Restart verification to get a fresh token.",
  },
}

const NEGATIVE_EVENT_KEYS: DomainEventKey[] = ['record_missing', 'failed']

type DomainEventsProps = {
  status: DomainStatus
  events: DomainEvent[]
}

export const DomainEvents = ({ status, events }: DomainEventsProps) => {
  const [nowMs] = useState(() => Date.now())
  const banner = BANNER_CONFIG[status]
  return (
    <section className="flex flex-col gap-4">
      <p className={cn('rounded-xl px-5 py-3 text-sm', banner.className)}>{banner.message}</p>
      <ol className="flex flex-wrap items-start gap-y-4 rounded-xl bg-card px-5 py-5 shadow-xs ring-1 ring-foreground/10">
        {events.map((event, index) => {
          const isReached = event.at !== null
          const isNegative = NEGATIVE_EVENT_KEYS.includes(event.key)
          return (
            <li
              key={event.key}
              className={cn('flex items-start gap-2', { 'min-w-0 flex-1 basis-36': index > 0 })}
            >
              {index > 0 && (
                <span
                  aria-hidden
                  className={cn('mt-3.5 h-px min-w-4 flex-1 bg-border', {
                    'bg-muted-foreground/40': isReached,
                  })}
                />
              )}
              <div className="flex shrink-0 flex-col items-center gap-1.5 text-center">
                <span
                  className={cn(
                    'flex size-7 items-center justify-center rounded-full border',
                    isReached && !isNegative && 'border-success bg-success/10 text-success',
                    isReached && isNegative && 'border-warning bg-warning/10 text-warning',
                    !isReached && 'border-dashed text-muted-foreground',
                  )}
                >
                  {isReached && !isNegative && <CheckIcon className="size-3.5" />}
                  {isReached && isNegative && <TriangleAlertIcon className="size-3.5" />}
                  {!isReached && <XIcon className="size-3 opacity-0" />}
                </span>
                <span
                  className={cn('text-xs font-medium whitespace-nowrap', {
                    'text-muted-foreground': !isReached,
                  })}
                >
                  {event.label}
                </span>
                <span className="text-xs text-muted-foreground tabular-nums" suppressHydrationWarning>
                  {event.at ? formatRelativeTime(event.at, nowMs) : '—'}
                </span>
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
