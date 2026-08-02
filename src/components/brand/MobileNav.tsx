'use client'

import Link from 'next/link'
import { Text } from '@/components/brand/Text'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  BookOpenIcon,
  CheckIcon,
  ChevronLeftIcon,
  GlobeIcon,
  KeyRoundIcon,
  LogOutIcon,
  PanelLeftIcon,
  PlusIcon,
  SettingsIcon,
} from 'lucide-react'
import { BackToAppLink } from '@/components/brand/BackToAppLink'
import { Button } from '@/components/ui/button'
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import type { AccountSession } from '@/lib/auth/server/session'
import { cn } from '@/lib/utils'
import { useAccountActions } from '@/lib/auth/client/useAccountActions'
import { useAccountSessions } from '@/lib/auth/client/useAccountSessions'

const SETTINGS_PATH_PREFIX = '/settings'

export const MENU_ROW_CLASS =
  'flex h-11 touch-manipulation items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors outline-none hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground focus-visible:ring-3 focus-visible:ring-ring/50 [&_svg]:size-4 [&_svg]:shrink-0'

type AccountRowProps = {
  account: AccountSession
  hasMultipleAccounts: boolean
  onSelect: (account: AccountSession) => void
  onSignOut: (account: AccountSession) => void
}

const AccountRow = ({ account, hasMultipleAccounts, onSelect, onSignOut }: AccountRowProps) => {
  const handleClick = () => onSelect(account)
  const handleSignOutClick = () => onSignOut(account)

  return (
    <div className="flex items-center gap-1">
      <button type="button" onClick={handleClick} className={cn(MENU_ROW_CLASS, 'min-w-0 flex-1')}>
        <Text as="span" variant="caption" className="flex size-6 shrink-0 items-center justify-center rounded-full bg-sidebar-accent font-medium text-sidebar-accent-foreground">
          {account.email.charAt(0).toUpperCase()}
        </Text>
        <span className="min-w-0 flex-1 truncate text-left">{account.email}</span>
        {account.isCurrent ? <span className="sr-only">Current account</span> : null}
        <CheckIcon aria-hidden className={cn('shrink-0', { 'opacity-0': !account.isCurrent })} />
      </button>
      {hasMultipleAccounts ? (
        <button
          type="button"
          onClick={handleSignOutClick}
          aria-label={`Sign out of ${account.email}`}
          className={cn(MENU_ROW_CLASS, 'size-11 shrink-0 justify-center px-0')}
        >
          <LogOutIcon />
        </button>
      ) : null}
    </div>
  )
}

const SETTINGS_LINKS = [
  { href: '/settings/general', label: 'General', Icon: SettingsIcon },
  { href: '/settings/api-keys', label: 'API keys', Icon: KeyRoundIcon },
] as const

export const MobileNav = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()
  const { handleSignOut, handleAddAccount, handleAccountSwitch, handleAccountSignOut } =
    useAccountActions()
  const { accounts, handleMenuOpen, removeAccount, isLoadingSessions } = useAccountSessions()

  const isSettingsSection = pathname.startsWith(SETTINGS_PATH_PREFIX)
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
    void handleAccountSwitch(account.activeSessionToken)
  }

  const handleAccountSignOutClick = (account: AccountSession) => {
    removeAccount(account.email)
    void handleAccountSignOut(account)
  }

  const handleAddAccountClick = () => {
    handleMenuClose()
    handleAddAccount()
  }

  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-end border-b bg-background/90 px-6 backdrop-blur md:hidden">
      <Sheet open={isMenuOpen} onOpenChange={handleMenuOpenChange}>
        <SheetTrigger
          render={<Button variant="ghost" size="icon-lg" aria-label="Open menu" className="-mr-3" />}
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
              {isSettingsSection ? (
                <BackToAppLink onNavigate={handleMenuClose} />
              ) : (
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
              )}
            </div>
            {isSettingsSection ? (
              <nav aria-label="Settings" className="flex flex-col gap-0.5 px-3 pt-1">
                {SETTINGS_LINKS.map(({ href, label, Icon }) => {
                  const isActive = pathname === href || pathname.startsWith(`${href}/`)
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={handleMenuClose}
                      aria-current={isActive ? 'page' : undefined}
                      className={cn(MENU_ROW_CLASS, {
                        'bg-sidebar-accent text-sidebar-accent-foreground': isActive,
                      })}
                    >
                      <Icon />
                      {label}
                    </Link>
                  )
                })}
              </nav>
            ) : (
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
                <Text variant="caption" className="px-3 pt-5 pb-1.5 font-medium text-muted-foreground/70">
                  Resources
                </Text>
                <Link href="/docs" onClick={handleMenuClose} className={MENU_ROW_CLASS}>
                  <BookOpenIcon />
                  Docs
                </Link>
              </nav>
            )}
            <div className="mt-auto flex flex-col gap-0.5 px-3 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <Text variant="caption" className="px-3 pb-1.5 font-medium text-muted-foreground/70">Accounts</Text>
              {accounts.map((account) => (
                <AccountRow
                  key={account.email}
                  account={account}
                  hasMultipleAccounts={hasMultipleAccounts}
                  onSelect={handleAccountSelect}
                  onSignOut={handleAccountSignOutClick}
                />
              ))}
              {isLoadingSessions && (
                <div aria-busy className="flex h-11 items-center gap-3 px-3">
                  <Skeleton className="size-6 shrink-0 rounded-full" />
                  <Skeleton className="h-4 flex-1" />
                </div>
              )}
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
