'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshIcon, TrashIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/cn'
import { deleteDomainAction, regenerateTokenAction } from '@/lib/domains/actions'
import type { DomainStatus } from '@/lib/domains/status'

type PendingConfirmation = 'regenerate' | 'delete' | null

type DangerZoneProps = {
  domainId: string
  hostname: string
  status: DomainStatus
}

export const DangerZone = ({ domainId, hostname, status }: DangerZoneProps) => {
  const router = useRouter()
  const [pendingConfirmation, setPendingConfirmation] = useState<PendingConfirmation>(null)
  const [isWorking, startTransition] = useTransition()

  const regenerateWarning =
    status === 'verified' || status === 'temporary_failure'
      ? `${hostname} goes back to pending until the new record is in place.`
      : 'The record value changes — update your DNS record with the new value.'

  const handleRequestConfirmation = (action: Exclude<PendingConfirmation, null>) => () => {
    setPendingConfirmation(action)
  }

  const handleCancel = () => {
    setPendingConfirmation(null)
  }

  const handleRegenerate = () => {
    startTransition(async () => {
      await regenerateTokenAction(domainId)
      setPendingConfirmation(null)
      router.refresh()
    })
  }

  const handleDelete = () => {
    startTransition(async () => {
      await deleteDomainAction(domainId)
    })
  }

  const rowClasses = 'flex flex-wrap items-center justify-between gap-3 px-4 py-3.5'

  return (
    <section className="rounded-xl border border-danger/30">
      <h3 className="border-b border-border px-4 py-3 text-sm font-semibold">Danger zone</h3>
      <div className="flex flex-col divide-y divide-border">
        <div className={rowClasses}>
          <div className="min-w-0">
            <p className="text-sm font-medium">Regenerate token</p>
            <p className="mt-0.5 text-xs leading-5 text-ink-muted">{regenerateWarning}</p>
          </div>
          {pendingConfirmation === 'regenerate' ? (
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={handleCancel} disabled={isWorking}>
                Cancel
              </Button>
              <Button variant="secondary" onClick={handleRegenerate} disabled={isWorking}>
                {isWorking ? 'Regenerating…' : 'Confirm regenerate'}
              </Button>
            </div>
          ) : (
            <Button variant="secondary" onClick={handleRequestConfirmation('regenerate')}>
              <RefreshIcon className="size-4" />
              Regenerate
            </Button>
          )}
        </div>
        <div className={rowClasses}>
          <div className="min-w-0">
            <p className="text-sm font-medium">Remove domain</p>
            <p className="mt-0.5 text-xs leading-5 text-ink-muted">
              Deletes {hostname} and its full check history. This cannot be undone.
            </p>
          </div>
          {pendingConfirmation === 'delete' ? (
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={handleCancel} disabled={isWorking}>
                Cancel
              </Button>
              <Button
                variant="secondary"
                onClick={handleDelete}
                disabled={isWorking}
                className={cn('border-danger/40 text-danger hover:bg-danger-soft')}
              >
                {isWorking ? 'Removing…' : 'Confirm remove'}
              </Button>
            </div>
          ) : (
            <Button
              variant="secondary"
              onClick={handleRequestConfirmation('delete')}
              className="border-danger/40 text-danger hover:bg-danger-soft"
            >
              <TrashIcon className="size-4" />
              Remove
            </Button>
          )}
        </div>
      </div>
    </section>
  )
}
