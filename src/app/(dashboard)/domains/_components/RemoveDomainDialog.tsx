'use client'

import { useTransition } from 'react'
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
import { Text } from '@/components/brand/Text'
import { deleteDomainAction } from '@/lib/domains/actions'

type RemoveDomainDialogProps = {
  domainId: string
  hostname: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const RemoveDomainDialog = ({
  domainId,
  hostname,
  open,
  onOpenChange,
}: RemoveDomainDialogProps) => {
  const [isRemoving, startTransition] = useTransition()

  const handleRemove = () => {
    startTransition(async () => {
      await deleteDomainAction(domainId)
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
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
          <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={handleRemove} loading={isRemoving}>
            Remove domain
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
