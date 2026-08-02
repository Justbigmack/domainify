'use client'

import { Suspense, use, useState, useTransition } from 'react'
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

type PendingAction = 'regenerate' | 'remove' | null

const REGENERATE_WARNING =
  'Issues a new record value and restarts verification. Your DNS record must be updated to match it.'
const REMOVE_FALLBACK_LABEL = 'this domain'

const ResolvedHostname = ({ hostname }: { hostname: Promise<string | null> }) => {
  const resolvedHostname = use(hostname)
  if (!resolvedHostname) return REMOVE_FALLBACK_LABEL
  return (
    <Text as="span" className="font-medium">
      {resolvedHostname}
    </Text>
  )
}

type DangerZoneProps = {
  hostname: Promise<string | null>
  domainId?: string
}

export const DangerZone = ({ hostname, domainId }: DangerZoneProps) => {
  const [pendingAction, setPendingAction] = useState<PendingAction>(null)
  const [isWorking, startTransition] = useTransition()

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
    if (!domainId) return
    startTransition(async () => {
      await regenerateTokenAction(domainId)
      setPendingAction(null)
    })
  }

  const handleRemove = () => {
    if (!domainId) return
    startTransition(async () => {
      await deleteDomainAction(domainId)
    })
  }

  const isConfirmDisabled = isWorking || !domainId

  return (
    <>
      <SectionContent>
        <SectionRow>
          <SectionRowText>
            <SectionLabel>Regenerate token</SectionLabel>
            <SectionDescription className="mt-0.5">{REGENERATE_WARNING}</SectionDescription>
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
              Deletes this domain and its full check history. This cannot be undone.
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
            <AlertDialogDescription>{REGENERATE_WARNING}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isWorking}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRegenerate} disabled={isConfirmDisabled}>
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
              <Suspense fallback={REMOVE_FALLBACK_LABEL}>
                <ResolvedHostname hostname={hostname} />
              </Suspense>{' '}
              and its full check history. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isWorking}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleRemove}
              disabled={isConfirmDisabled}
            >
              {isWorking ? 'Removing…' : 'Remove domain'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
