import { CheckIcon } from 'lucide-react'
import { Text } from '@/components/brand/Text'
import {
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu'
import type { AccountSession } from '@/lib/auth/server/session'
import { cn } from '@/lib/utils'

type AccountMenuItemProps = {
  account: AccountSession
  hasMultipleAccounts: boolean
  onSwitch: (account: AccountSession) => void
  onSignOut: (account: AccountSession) => void
}

type AccountRowProps = {
  account: AccountSession
}

const AccountRow = ({ account }: AccountRowProps) => (
  <>
    <Text
      as="span"
      variant="caption"
      className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted font-medium"
    >
      {account.email.charAt(0).toUpperCase()}
    </Text>
    <span className="min-w-0 flex-1 truncate">{account.email}</span>
    {account.isCurrent ? <span className="sr-only">Current account</span> : null}
    <CheckIcon aria-hidden className={cn('shrink-0', { 'opacity-0': !account.isCurrent })} />
  </>
)

export const AccountMenuItem = ({
  account,
  hasMultipleAccounts,
  onSwitch,
  onSignOut,
}: AccountMenuItemProps) => {
  const handleSwitch = () => onSwitch(account)
  const handleSignOut = () => onSignOut(account)

  if (!hasMultipleAccounts) {
    return (
      <DropdownMenuItem>
        <AccountRow account={account} />
        <span aria-hidden className="size-4 shrink-0" />
      </DropdownMenuItem>
    )
  }

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <AccountRow account={account} />
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="min-w-44">
        {account.isCurrent ? null : (
          <DropdownMenuItem onClick={handleSwitch}>Switch to this account</DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={handleSignOut}>Sign out</DropdownMenuItem>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  )
}
