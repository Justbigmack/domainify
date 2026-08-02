'use client'

import { useState } from 'react'
import { EllipsisIcon } from 'lucide-react'
import { RevokeKeyDialog } from '@/app/(dashboard)/settings/_components/RevokeKeyDialog'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type ApiKeyRowActionsProps = {
  keyId: string
  keyName: string
}

export const ApiKeyRowActions = ({ keyId, keyName }: ApiKeyRowActionsProps) => {
  const [isRevokeDialogOpen, setIsRevokeDialogOpen] = useState(false)

  const handleRequestRevoke = () => {
    setIsRevokeDialogOpen(true)
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
      <RevokeKeyDialog
        keyId={keyId}
        keyName={keyName}
        open={isRevokeDialogOpen}
        onOpenChange={setIsRevokeDialogOpen}
      />
    </>
  )
}
