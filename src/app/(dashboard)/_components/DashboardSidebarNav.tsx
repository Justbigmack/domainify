'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BookOpenIcon,
  ChevronLeftIcon,
  GlobeIcon,
  KeyRoundIcon,
  SettingsIcon,
} from 'lucide-react'
import { NavLink, SidebarNav, SidebarTooltip, useSidebar } from '@/components/brand/Sidebar'
import { cn } from '@/lib/utils'

const SETTINGS_PATH_PREFIX = '/settings'

const SettingsBackLink = () => {
  const { isCollapsed } = useSidebar()

  return (
    <SidebarTooltip label="Back to app">
      <Link
        href="/domains"
        className="-ml-2.5 inline-flex h-8 w-fit touch-manipulation items-center gap-1 overflow-hidden rounded-[min(var(--radius-md),10px)] px-2.5 text-[0.8125rem] font-normal whitespace-nowrap text-muted-foreground transition-colors outline-none hover:bg-sidebar-accent/60 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <ChevronLeftIcon aria-hidden strokeWidth={1.5} className="size-3.5 shrink-0" />
        <span
          className={cn(
            'truncate transition-opacity duration-200 ease-in-out motion-reduce:transition-none',
            { 'opacity-0': isCollapsed },
          )}
        >
          Back to app
        </span>
      </Link>
    </SidebarTooltip>
  )
}

export const DashboardSidebarNav = () => {
  const pathname = usePathname()
  const isSettingsSection = pathname.startsWith(SETTINGS_PATH_PREFIX)

  if (isSettingsSection) {
    return (
      <>
        <div className="flex shrink-0 items-center px-6 pt-3">
          <SettingsBackLink />
        </div>
        <SidebarNav label="Settings" className="pt-2">
          <NavLink href="/settings/general" label="General">
            <SettingsIcon />
          </NavLink>
          <NavLink href="/settings/api-keys" label="API keys">
            <KeyRoundIcon />
          </NavLink>
        </SidebarNav>
      </>
    )
  }

  return (
    <SidebarNav label="Main" className="pt-4">
      <NavLink href="/domains" label="Domains">
        <GlobeIcon />
      </NavLink>
      <NavLink href="/settings/general" label="Settings">
        <SettingsIcon />
      </NavLink>
      <NavLink href="/docs" label="Docs">
        <BookOpenIcon />
      </NavLink>
    </SidebarNav>
  )
}
