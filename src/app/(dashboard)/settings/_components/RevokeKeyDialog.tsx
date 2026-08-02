'use client'

import { useRouter } from 'next/navigation'
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
import { authClient } from '@/lib/auth/client'

type RevokeKeyDialogProps = {
  keyId: string
  keyName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const RevokeKeyDialog = ({ keyId, keyName, open, onOpenChange }: RevokeKeyDialogProps) => {
  const router = useRouter()
  const [isRevoking, startTransition] = useTransition()

  const handleRevoke = () => {
    startTransition(async () => {
      await authClient.apiKey.delete({ keyId })
      onOpenChange(false)
      router.refresh()
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Revoke key</AlertDialogTitle>
          <AlertDialogDescription>
            Revokes{' '}
            <Text as="span" className="font-medium">
              {keyName}
            </Text>{' '}
            immediately. Requests using it will start failing with 401. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isRevoking}>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={handleRevoke} disabled={isRevoking}>
            {isRevoking ? 'Revoking…' : 'Revoke key'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
