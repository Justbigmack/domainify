'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { EllipsisIcon } from 'lucide-react'
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
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { authClient } from '@/lib/authClient'

type ApiKeyRowActionsProps = {
  keyId: string
  keyName: string
}

export const ApiKeyRowActions = ({ keyId, keyName }: ApiKeyRowActionsProps) => {
  const router = useRouter()
  const [isRevokeDialogOpen, setIsRevokeDialogOpen] = useState(false)
  const [isRevoking, startTransition] = useTransition()

  const handleRequestRevoke = () => {
    setIsRevokeDialogOpen(true)
  }

  const handleRevoke = () => {
    startTransition(async () => {
      await authClient.apiKey.delete({ keyId })
      setIsRevokeDialogOpen(false)
      router.refresh()
    })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              className="-mr-2.5 text-muted-foreground"
              aria-label={`Actions for ${keyName}`}
            />
          }
        >
          <EllipsisIcon className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-auto min-w-40">
          <DropdownMenuItem variant="destructive" onClick={handleRequestRevoke}>
            Revoke key
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog open={isRevokeDialogOpen} onOpenChange={setIsRevokeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke key</AlertDialogTitle>
            <AlertDialogDescription>
              Revokes{' '}
              <Text as="span" className="font-medium">
                {keyName}
              </Text>{' '}
              immediately.
              Requests using it will start failing with 401. This cannot be undone.
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
    </>
  )
}
