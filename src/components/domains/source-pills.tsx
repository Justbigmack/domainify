'use client'

import { useState } from 'react'
import { AlertTriangleIcon, CheckIcon, MinusIcon, XIcon } from '@/components/icons'
import { cn } from '@/lib/cn'
import type { SourcePillState, SourcePillView } from '@/lib/domains/insights'

const MINUTE_MS = 60 * 1000

const STATE_CLASSES: Record<SourcePillState, string> = {
  match: 'text-success',
  stale_value: 'text-warning',
  missing: 'text-ink-subtle',
  error: 'text-warning',
  unchecked: 'text-ink-subtle',
}

const STATE_HINTS: Record<SourcePillState, string> = {
  match: 'Record found',
  stale_value: 'Old value cached',
  missing: 'No record yet',
  error: "Couldn't reach",
  unchecked: 'Not checked yet',
}

const stateIcon = (state: SourcePillState) => {
  if (state === 'match') return <CheckIcon className="size-3.5" />
  if (state === 'stale_value' || state === 'error') return <AlertTriangleIcon className="size-3.5" />
  if (state === 'missing') return <XIcon className="size-3.5" />
  return <MinusIcon className="size-3.5" />
}

const cacheHint = (cachedUntil: string | null, nowMs: number): string | null => {
  if (!cachedUntil) return null
  const remainingMs = new Date(cachedUntil).getTime() - nowMs
  if (remainingMs <= 0) return null
  return `cached up to ${Math.ceil(remainingMs / MINUTE_MS)}m more`
}

type SourcePillsProps = {
  pills: SourcePillView[]
}

export const SourcePills = ({ pills }: SourcePillsProps) => {
  const [nowMs] = useState(() => Date.now())
  return (
  <div className="rounded-xl border border-border bg-surface">
    <h3 className="border-b border-border px-4 py-3 text-sm font-semibold">Propagation</h3>
    <ul className="flex flex-col divide-y divide-border">
      {pills.map((pill) => {
        const hint = cacheHint(pill.cachedUntil, nowMs)
        return (
          <li key={pill.source} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
            <span className="min-w-0 truncate text-ink-muted">{pill.label}</span>
            <span
              className={cn(
                'flex shrink-0 items-center gap-1.5 text-xs font-medium',
                STATE_CLASSES[pill.state],
              )}
            >
              {stateIcon(pill.state)}
              {STATE_HINTS[pill.state]}
              {hint && <span className="font-normal text-ink-subtle">· {hint}</span>}
            </span>
          </li>
        )
      })}
    </ul>
  </div>
  )
}
