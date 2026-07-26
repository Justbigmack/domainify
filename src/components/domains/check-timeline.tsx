'use client'

import { useState } from 'react'
import { AlertTriangleIcon, CheckIcon, MinusIcon, XIcon } from '@/components/icons'
import { cn } from '@/lib/cn'
import { formatRelativeTime } from '@/lib/format-time'
import type { CheckView } from '@/lib/domains/view'
import type { CheckSourceSnapshot, CheckTrigger, CheckVerdict } from '@/lib/dns/types'

const INITIAL_VISIBLE_COUNT = 10

const TRIGGER_LABELS: Record<CheckTrigger, string> = {
  manual: 'Manual',
  poll: 'Auto',
  cron: 'Scheduled',
  on_read: 'On load',
}

const VERDICT_LABELS: Record<CheckVerdict, string> = {
  verified: 'Record found',
  no_record: 'No record',
  wrong_value: 'Different token',
  misplaced_record: 'Doubled host',
  dns_error: 'Lookup error',
}

const VERDICT_DOT_CLASSES: Record<CheckVerdict, string> = {
  verified: 'bg-success',
  no_record: 'bg-border-strong',
  wrong_value: 'bg-warning',
  misplaced_record: 'bg-warning',
  dns_error: 'bg-danger',
}

const sourceIcon = (snapshot: CheckSourceSnapshot) => {
  if (snapshot.kind === 'lookup_error') return <AlertTriangleIcon className="size-3 text-warning" />
  if (snapshot.kind === 'records') return <CheckIcon className="size-3 text-success" />
  return <XIcon className="size-3 text-ink-subtle" />
}

type CheckTimelineProps = {
  checks: CheckView[]
}

export const CheckTimeline = ({ checks }: CheckTimelineProps) => {
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT)
  const [nowMs] = useState(() => Date.now())

  const visibleChecks = checks.slice(0, visibleCount)
  const hasMore = checks.length > visibleCount

  const handleShowMore = () => {
    setVisibleCount(checks.length)
  }

  return (
    <section className="rounded-xl border border-border bg-surface">
      <h3 className="border-b border-border px-4 py-3 text-sm font-semibold">Checks</h3>
      {visibleChecks.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-ink-muted">No checks yet.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {visibleChecks.map((check) => (
            <li key={check.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 text-sm">
              <span
                className="w-16 shrink-0 text-xs text-ink-subtle tabular-nums"
                suppressHydrationWarning
              >
                {formatRelativeTime(check.checkedAt, nowMs)}
              </span>
              <span className="inline-flex w-20 shrink-0 justify-center rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium text-ink-muted">
                {TRIGGER_LABELS[check.trigger]}
              </span>
              <span className="flex min-w-28 items-center gap-1.5">
                <span className={cn('size-1.5 shrink-0 rounded-full', VERDICT_DOT_CLASSES[check.verdict])} />
                {VERDICT_LABELS[check.verdict]}
              </span>
              <span className="ml-auto flex items-center gap-2">
                {check.sources.length === 0 ? (
                  <MinusIcon className="size-3 text-ink-subtle" />
                ) : (
                  check.sources.map((snapshot) => (
                    <span key={snapshot.source} title={snapshot.source} className="inline-flex">
                      {sourceIcon(snapshot)}
                    </span>
                  ))
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
      {hasMore && (
        <div className="border-t border-border px-4 py-2.5">
          <button
            type="button"
            onClick={handleShowMore}
            className="rounded-md text-sm font-medium text-ink-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            Show {checks.length - visibleCount} more
          </button>
        </div>
      )}
    </section>
  )
}
