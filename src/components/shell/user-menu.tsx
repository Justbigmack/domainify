'use client'

import { CheckIcon, ChevronsUpDownIcon, LogOutIcon, PlusIcon } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { AccountSession } from '@/lib/api/session'
import { cn } from '@/lib/utils'
import { useAccountActions } from './use-account-actions'
import { useAccountSessions } from './use-account-sessions'

type UserMenuProps = {
  userEmail: string
  isCollapsed: boolean
}

type AccountItemProps = {
  account: AccountSession
  onSelect: (account: AccountSession) => void
}

const AccountItem = ({ account, onSelect }: AccountItemProps) => {
  const handleClick = () => onSelect(account)

  return (
    <DropdownMenuItem onClick={handleClick}>
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
        {account.email.charAt(0).toUpperCase()}
      </span>
      <span className="min-w-0 flex-1 truncate">{account.email}</span>
      <CheckIcon
        aria-hidden={!account.isCurrent}
        className={cn('shrink-0', { 'opacity-0': !account.isCurrent })}
      />
    </DropdownMenuItem>
  )
}

export const UserMenu = ({ userEmail, isCollapsed }: UserMenuProps) => {
  const { handleSignOut, handleAddAccount, handleAccountSwitch } = useAccountActions()
  const { accounts, handleMenuOpen } = useAccountSessions(userEmail)

  const hasMultipleAccounts = accounts.length > 1

  const handleAccountSelect = (account: AccountSession) => {
    if (account.isCurrent) return
    void handleAccountSwitch(account.sessionToken)
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) handleMenuOpen()
  }

  return (
    <DropdownMenu onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger
        aria-label={isCollapsed ? userEmail : undefined}
        className="flex h-9 w-full items-center gap-2 overflow-hidden rounded-md px-2 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors outline-none select-none hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground focus-visible:ring-3 focus-visible:ring-ring/50 aria-expanded:bg-sidebar-accent aria-expanded:text-sidebar-accent-foreground"
      >
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-xs font-medium text-sidebar-accent-foreground">
          {userEmail.charAt(0).toUpperCase()}
        </span>
        <span
          className={cn(
            'min-w-0 flex-1 truncate text-left transition-opacity duration-200 ease-in-out motion-reduce:transition-none',
            { 'opacity-0': isCollapsed },
          )}
        >
          {userEmail}
        </span>
        <ChevronsUpDownIcon
          className={cn(
            'size-4 shrink-0 opacity-60 transition-opacity duration-200 ease-in-out motion-reduce:transition-none',
            { 'opacity-0': isCollapsed },
          )}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side={isCollapsed ? 'right' : 'bottom'}
        align="start"
        sideOffset={8}
        className="min-w-56"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel>Accounts</DropdownMenuLabel>
          {accounts.map((account) => (
            <AccountItem key={account.email} account={account} onSelect={handleAccountSelect} />
          ))}
          <DropdownMenuItem onClick={handleAddAccount}>
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-dashed border-muted-foreground/40 text-muted-foreground">
              <PlusIcon className="size-3.5" />
            </span>
            Add account
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOutIcon />
          {hasMultipleAccounts ? 'Sign out of all accounts' : 'Sign out'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
