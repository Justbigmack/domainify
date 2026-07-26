'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import { CheckIcon, ChevronDownIcon } from '@/components/icons'
import { CopyButton } from '@/components/ui/copy-button'
import { cn } from '@/lib/cn'

const CHALLENGE_PREFIX = '_domainify-challenge'
const VALUE_HEAD_LENGTH = 24
const VALUE_TAIL_LENGTH = 8

export type RecordStatus = 'verified' | 'pending' | 'not_found'

type HostMode = 'prefix' | 'full'

const STATUS_LABELS: Record<RecordStatus, string> = {
  verified: 'Verified',
  pending: 'Pending',
  not_found: 'Not found',
}

const STATUS_CLASSES: Record<RecordStatus, string> = {
  verified: 'bg-success-soft text-success',
  pending: 'bg-info-soft text-info',
  not_found: 'bg-surface-muted text-ink-muted',
}

const truncateMiddle = (value: string): string =>
  value.length <= VALUE_HEAD_LENGTH + VALUE_TAIL_LENGTH
    ? value
    : `${value.slice(0, VALUE_HEAD_LENGTH)}…${value.slice(-VALUE_TAIL_LENGTH)}`

type RecordCardProps = {
  challengeHost: string
  recordValue: string
  recordStatus?: RecordStatus | null
  headerActions?: ReactNode
}

export const RecordCard = ({
  challengeHost,
  recordValue,
  recordStatus = null,
  headerActions,
}: RecordCardProps) => {
  const [hostMode, setHostMode] = useState<HostMode>('prefix')
  const [isCollapsed, setIsCollapsed] = useState(recordStatus === 'verified')

  const displayedHost = hostMode === 'prefix' ? CHALLENGE_PREFIX : challengeHost

  const handleToggleCollapsed = () => {
    setIsCollapsed((current) => !current)
  }

  const handleHostModeChange = (mode: HostMode) => () => {
    setHostMode(mode)
  }

  return (
    <section className="rounded-xl border border-border bg-surface">
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold">DNS record</h3>
        <div className="flex items-center gap-2">
          {headerActions}
          {recordStatus === 'verified' && (
            <button
              type="button"
              onClick={handleToggleCollapsed}
              aria-expanded={!isCollapsed}
              className="inline-flex size-7 items-center justify-center rounded-md text-ink-subtle transition-colors hover:bg-surface-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              <ChevronDownIcon className={cn('size-4 transition-transform', { 'rotate-180': !isCollapsed })} />
            </button>
          )}
        </div>
      </header>
      {isCollapsed ? (
        <p className="flex items-center gap-2 px-4 py-3.5 text-sm text-ink-muted">
          <CheckIcon className="size-4 text-success" />
          TXT record verified — keep it in place to stay verified.
        </p>
      ) : (
        <div className="flex flex-col gap-4 p-4">
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-muted/50 text-xs tracking-wide text-ink-subtle uppercase">
                  <th scope="col" className="px-3 py-2 font-medium">Type</th>
                  <th scope="col" className="px-3 py-2 font-medium">Host</th>
                  <th scope="col" className="px-3 py-2 font-medium">Value</th>
                  <th scope="col" className="px-3 py-2 font-medium">TTL</th>
                  {recordStatus !== null && (
                    <th scope="col" className="px-3 py-2 font-medium">Status</th>
                  )}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-3 py-3 font-mono">TXT</td>
                  <td className="px-3 py-3">
                    <span className="inline-flex items-center gap-1">
                      <span className="font-mono" title={displayedHost}>
                        {truncateMiddle(displayedHost)}
                      </span>
                      <CopyButton value={displayedHost} label="Copy record host" />
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span className="inline-flex items-center gap-1">
                      <span className="font-mono" title={recordValue}>
                        {truncateMiddle(recordValue)}
                      </span>
                      <CopyButton value={recordValue} label="Copy record value" />
                    </span>
                  </td>
                  <td className="px-3 py-3 text-ink-muted">Auto</td>
                  {recordStatus !== null && (
                    <td className="px-3 py-3">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap',
                          STATUS_CLASSES[recordStatus],
                        )}
                      >
                        {STATUS_LABELS[recordStatus]}
                      </span>
                    </td>
                  )}
                </tr>
              </tbody>
            </table>
          </div>
          <fieldset className="flex flex-wrap items-center gap-2 text-sm">
            <legend className="sr-only">Host field format</legend>
            <span className="text-ink-muted">Host field format:</span>
            <div className="inline-flex rounded-lg border border-border p-0.5" role="group">
              <button
                type="button"
                onClick={handleHostModeChange('prefix')}
                aria-pressed={hostMode === 'prefix'}
                className={cn(
                  'rounded-md px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
                  hostMode === 'prefix' ? 'bg-surface-muted text-ink' : 'text-ink-muted hover:text-ink',
                )}
              >
                Just the prefix
              </button>
              <button
                type="button"
                onClick={handleHostModeChange('full')}
                aria-pressed={hostMode === 'full'}
                className={cn(
                  'rounded-md px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
                  hostMode === 'full' ? 'bg-surface-muted text-ink' : 'text-ink-muted hover:text-ink',
                )}
              >
                Full name
              </button>
            </div>
            <p className="w-full text-xs leading-5 text-ink-subtle">
              Most providers append your domain to the Host field automatically — paste just the
              prefix there. If yours expects the full name, switch the toggle.
            </p>
          </fieldset>
        </div>
      )}
    </section>
  )
}
