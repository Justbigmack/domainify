'use client'

import { useState, useTransition } from 'react'
import { RefreshCwIcon, Trash2Icon } from 'lucide-react'
import { GhostButton } from '@/components/brand/GhostButton'
import { Text } from '@/components/brand/Text'
import {
  SectionContent,
  SectionDescription,
  SectionDivider,
  SectionLabel,
  SectionRow,
  SectionRowText,
} from '@/components/brand/Section'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { deleteDomainAction, regenerateTokenAction } from '@/lib/domains/actions'
import type { DomainStatus } from '@/lib/domains/status'

type PendingAction = 'regenerate' | 'remove' | null

const TruncatedHostname = ({ hostname }: { hostname: string }) => (
  <span className="inline-block max-w-full truncate align-bottom" title={hostname}>
    {hostname}
  </span>
)

type DangerZoneProps = {
  domainId: string
  hostname: string
  status: DomainStatus
}

export const DangerZone = ({ domainId, hostname, status }: DangerZoneProps) => {
  const [pendingAction, setPendingAction] = useState<PendingAction>(null)
  const [isWorking, startTransition] = useTransition()

  const revertsToPending = status === 'verified' || status === 'temporary_failure'
  const regenerateWarning = revertsToPending ? (
    <>
      <TruncatedHostname hostname={hostname} /> goes back to pending until the new record is in
      place.
    </>
  ) : (
    'The record value changes. Update your DNS record with the new value.'
  )

  const handleRequestRegenerate = () => {
    setPendingAction('regenerate')
  }

  const handleRequestRemove = () => {
    setPendingAction('remove')
  }

  const handleDialogOpenChange = (isOpen: boolean) => {
    if (isWorking || isOpen) return
    setPendingAction(null)
  }

  const handleRegenerate = () => {
    startTransition(async () => {
      await regenerateTokenAction(domainId)
      setPendingAction(null)
    })
  }

  const handleRemove = () => {
    startTransition(async () => {
      await deleteDomainAction(domainId)
    })
  }

  return (
    <>
      <SectionContent>
        <SectionRow>
          <SectionRowText>
            <SectionLabel>Regenerate token</SectionLabel>
            <SectionDescription className="mt-0.5">{regenerateWarning}</SectionDescription>
          </SectionRowText>
          <GhostButton icon={RefreshCwIcon} className="-mr-2.5" onClick={handleRequestRegenerate}>
            Regenerate
          </GhostButton>
        </SectionRow>
        <SectionDivider />
        <SectionRow>
          <SectionRowText>
            <SectionLabel>Remove domain</SectionLabel>
            <SectionDescription className="mt-0.5">
              Deletes <TruncatedHostname hostname={hostname} /> and its full check history. This
              cannot be undone.
            </SectionDescription>
          </SectionRowText>
          <GhostButton
            icon={Trash2Icon}
            variant="destructive"
            className="-mr-2.5"
            onClick={handleRequestRemove}
          >
            Remove
          </GhostButton>
        </SectionRow>
      </SectionContent>
      <AlertDialog open={pendingAction === 'regenerate'} onOpenChange={handleDialogOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Regenerate token?</AlertDialogTitle>
            <AlertDialogDescription>{regenerateWarning}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isWorking}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRegenerate} disabled={isWorking}>
              {isWorking ? 'Regenerating…' : 'Regenerate token'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={pendingAction === 'remove'} onOpenChange={handleDialogOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove domain</AlertDialogTitle>
            <AlertDialogDescription>
              Deletes{' '}
              <Text as="span" className="font-medium">
                {hostname}
              </Text>{' '}
              and its full
              check history. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isWorking}>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleRemove} disabled={isWorking}>
              {isWorking ? 'Removing…' : 'Remove domain'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
