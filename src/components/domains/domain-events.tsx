'use client'

import { useState } from 'react'
import { AlertTriangleIcon, CheckIcon, XIcon } from '@/components/icons'
import { cn } from '@/lib/cn'
import { formatRelativeTime } from '@/lib/format-time'
import type { DomainEvent, DomainEventKey } from '@/lib/domains/insights'
import type { DomainStatus } from '@/lib/domains/status'

const BANNER_CONFIG: Record<DomainStatus, { className: string; message: string }> = {
  pending: {
    className: 'bg-info-soft text-info',
    message: 'Waiting for your DNS record. We check automatically — leave the record in place once added.',
  },
  verified: {
    className: 'bg-success-soft text-success',
    message: 'Domain verified: ownership is proven. Keep the record in place to stay verified.',
  },
  temporary_failure: {
    className: 'bg-warning-soft text-warning',
    message: 'We can no longer find your record. Restore it before the grace deadline to keep verified status.',
  },
  failed: {
    className: 'bg-danger-soft text-danger',
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
      <p className={cn('rounded-xl px-4 py-3 text-sm font-medium', banner.className)}>
        {banner.message}
      </p>
      <ol className="flex flex-wrap items-start gap-y-4 rounded-xl border border-border bg-surface px-4 py-5">
        {events.map((event, index) => {
          const isReached = event.at !== null
          const isNegative = NEGATIVE_EVENT_KEYS.includes(event.key)
          return (
            <li key={event.key} className="flex min-w-0 flex-1 items-start gap-2 basis-36">
              {index > 0 && (
                <span
                  aria-hidden
                  className={cn('mt-3.5 h-px min-w-4 flex-1 bg-border', {
                    'bg-border-strong': isReached,
                  })}
                />
              )}
              <div className="flex shrink-0 flex-col items-center gap-1.5 text-center">
                <span
                  className={cn(
                    'flex size-7 items-center justify-center rounded-full border',
                    isReached && !isNegative && 'border-success bg-success-soft text-success',
                    isReached && isNegative && 'border-warning bg-warning-soft text-warning',
                    !isReached && 'border-dashed border-border text-ink-subtle',
                  )}
                >
                  {isReached && !isNegative && <CheckIcon className="size-3.5" />}
                  {isReached && isNegative && <AlertTriangleIcon className="size-3.5" />}
                  {!isReached && <XIcon className="size-3 opacity-0" />}
                </span>
                <span
                  className={cn('text-xs font-medium whitespace-nowrap', {
                    'text-ink-subtle': !isReached,
                  })}
                >
                  {event.label}
                </span>
                <span className="text-xs text-ink-subtle tabular-nums" suppressHydrationWarning>
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
