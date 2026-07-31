'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  BookOpenIcon,
  CheckIcon,
  ChevronLeftIcon,
  GlobeIcon,
  LogOutIcon,
  PanelLeftIcon,
  PlusIcon,
  SettingsIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import type { AccountSession } from '@/lib/api/session'
import { cn } from '@/lib/utils'
import { useAccountActions } from './useAccountActions'
import { useAccountSessions } from './useAccountSessions'

const MENU_ROW_CLASS =
  'flex h-11 touch-manipulation items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors outline-none hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground focus-visible:ring-3 focus-visible:ring-ring/50 [&_svg]:size-4 [&_svg]:shrink-0'

type MobileNavProps = {
  userEmail: string
}

type AccountRowProps = {
  account: AccountSession
  onSelect: (account: AccountSession) => void
}

const AccountRow = ({ account, onSelect }: AccountRowProps) => {
  const handleClick = () => onSelect(account)

  return (
    <button type="button" onClick={handleClick} className={MENU_ROW_CLASS}>
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-xs font-medium text-sidebar-accent-foreground">
        {account.email.charAt(0).toUpperCase()}
      </span>
      <span className="min-w-0 flex-1 truncate text-left">{account.email}</span>
      <CheckIcon
        aria-hidden={!account.isCurrent}
        className={cn('shrink-0', { 'opacity-0': !account.isCurrent })}
      />
    </button>
  )
}

export const MobileNav = ({ userEmail }: MobileNavProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()
  const { handleSignOut, handleAddAccount, handleAccountSwitch } = useAccountActions()
  const { accounts, handleMenuOpen } = useAccountSessions(userEmail)

  const isDomainsActive = pathname === '/domains' || pathname.startsWith('/domains/')
  const hasMultipleAccounts = accounts.length > 1
  const handleMenuClose = () => setIsMenuOpen(false)

  const handleMenuOpenChange = (isOpen: boolean) => {
    setIsMenuOpen(isOpen)
    if (isOpen) handleMenuOpen()
  }

  const handleAccountSelect = (account: AccountSession) => {
    handleMenuClose()
    if (account.isCurrent) return
    void handleAccountSwitch(account.sessionToken)
  }

  const handleAddAccountClick = () => {
    handleMenuClose()
    handleAddAccount()
  }

  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center border-b bg-background/90 px-6 backdrop-blur md:hidden">
      <Sheet open={isMenuOpen} onOpenChange={handleMenuOpenChange}>
        <SheetTrigger
          render={<Button variant="ghost" size="icon-lg" aria-label="Open menu" className="-ml-3" />}
        >
          <PanelLeftIcon />
        </SheetTrigger>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="w-64 gap-0 bg-sidebar p-0 motion-reduce:transition-none"
        >
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <div className="flex flex-1 flex-col overflow-y-auto">
            <div className="flex h-14 shrink-0 items-center px-6">
              <SheetClose
                render={
                  <button
                    type="button"
                    className="-ml-2.5 inline-flex h-8 w-fit touch-manipulation items-center gap-1 rounded-[min(var(--radius-md),10px)] px-2.5 text-[0.8125rem] font-normal text-muted-foreground transition-colors outline-none hover:bg-sidebar-accent/60 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                  />
                }
              >
                <ChevronLeftIcon aria-hidden strokeWidth={1.5} className="size-3.5 shrink-0" />
                Back to app
              </SheetClose>
            </div>
            <nav aria-label="Main" className="flex flex-col gap-0.5 px-3 pt-1">
              <Link
                href="/domains"
                onClick={handleMenuClose}
                aria-current={isDomainsActive ? 'page' : undefined}
                className={cn(MENU_ROW_CLASS, {
                  'bg-sidebar-accent text-sidebar-accent-foreground': isDomainsActive,
                })}
              >
                <GlobeIcon />
                Domains
              </Link>
              <Link href="/settings/general" onClick={handleMenuClose} className={MENU_ROW_CLASS}>
                <SettingsIcon />
                Settings
              </Link>
              <p className="px-3 pt-5 pb-1.5 text-xs font-medium text-muted-foreground/70">
                Resources
              </p>
              <Link href="/docs" onClick={handleMenuClose} className={MENU_ROW_CLASS}>
                <BookOpenIcon />
                Docs
              </Link>
            </nav>
            <div className="mt-auto flex flex-col gap-0.5 px-3 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <p className="px-3 pb-1.5 text-xs font-medium text-muted-foreground/70">Accounts</p>
              {accounts.map((account) => (
                <AccountRow key={account.email} account={account} onSelect={handleAccountSelect} />
              ))}
              <button type="button" onClick={handleAddAccountClick} className={MENU_ROW_CLASS}>
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-dashed border-muted-foreground/40">
                  <PlusIcon className="size-3.5" />
                </span>
                Add account
              </button>
              <button type="button" onClick={handleSignOut} className={MENU_ROW_CLASS}>
                <LogOutIcon />
                {hasMultipleAccounts ? 'Sign out of all accounts' : 'Sign out'}
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  )
}
