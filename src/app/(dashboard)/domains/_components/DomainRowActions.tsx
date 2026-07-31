'use client'

import Link from 'next/link'
import { useState } from 'react'
import { EllipsisIcon } from 'lucide-react'
import { RemoveDomainDialog } from '@/app/(dashboard)/domains/_components/RemoveDomainDialog'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type DomainRowActionsProps = {
  domainId: string
  hostname: string
}

export const DomainRowActions = ({ domainId, hostname }: DomainRowActionsProps) => {
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false)

  const handleRequestRemove = () => {
    setIsRemoveDialogOpen(true)
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
              aria-label={`Actions for ${hostname}`}
            />
          }
        >
          <EllipsisIcon className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-auto min-w-40">
          <DropdownMenuItem render={<Link href={`/domains/${domainId}`} />}>
            View details
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={handleRequestRemove}>
            Remove domain
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <RemoveDomainDialog
        domainId={domainId}
        hostname={hostname}
        open={isRemoveDialogOpen}
        onOpenChange={setIsRemoveDialogOpen}
      />
    </>
  )
}
