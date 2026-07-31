'use client'

import { useState } from 'react'
import { BookOpenIcon, GlobeIcon, PanelLeftIcon, SettingsIcon } from 'lucide-react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { NavLink } from './NavLink'
import { SIDEBAR_COLLAPSED_COOKIE, SIDEBAR_COOKIE_MAX_AGE_SECONDS } from './sidebarCookie'
import { SidebarTooltip } from './SidebarTooltip'
import { UserMenu } from './UserMenu'

const MUTED_ROW_CLASS =
  'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'

type SidebarProps = {
  userEmail: string
  defaultCollapsed: boolean
}

export const Sidebar = ({ userEmail, defaultCollapsed }: SidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)

  const handleToggle = () => {
    const nextCollapsed = !isCollapsed
    setIsCollapsed(nextCollapsed)
    document.cookie = `${SIDEBAR_COLLAPSED_COOKIE}=${nextCollapsed}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE_SECONDS}`
  }

  return (
    <TooltipProvider>
      <aside
        className={cn(
          'sticky top-0 flex h-dvh shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-in-out motion-reduce:transition-none',
          { 'w-16': isCollapsed, 'w-60': !isCollapsed },
        )}
      >
        <div
          className={cn(
            'relative mx-3 mt-3 transition-[height] duration-200 ease-in-out motion-reduce:transition-none',
            { 'h-19': isCollapsed, 'h-9': !isCollapsed },
          )}
        >
          <div
            className={cn(
              'transition-[margin] duration-200 ease-in-out motion-reduce:transition-none',
              { 'mr-0': isCollapsed, 'mr-10': !isCollapsed },
            )}
          >
            <UserMenu userEmail={userEmail} isCollapsed={isCollapsed} />
          </div>
          <SidebarTooltip label="Expand sidebar" isCollapsed={isCollapsed}>
            <button
              type="button"
              onClick={handleToggle}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className={cn(
                'absolute top-0 right-0 flex h-9 items-center justify-center rounded-md outline-none transition-[translate,width,color,background-color] duration-200 ease-in-out focus-visible:ring-3 focus-visible:ring-ring/50 motion-reduce:transition-none',
                MUTED_ROW_CLASS,
                { 'w-10 translate-y-10': isCollapsed, 'w-9 translate-y-0': !isCollapsed },
              )}
            >
              <PanelLeftIcon className="size-4" />
            </button>
          </SidebarTooltip>
        </div>
        <nav aria-label="Main" className="flex flex-1 flex-col gap-1 px-3 pt-4">
          <NavLink href="/domains" label="Domains" isCollapsed={isCollapsed}>
            <GlobeIcon />
          </NavLink>
          <NavLink href="/settings/general" label="Settings" isCollapsed={isCollapsed}>
            <SettingsIcon />
          </NavLink>
          <NavLink href="/docs" label="Docs" isCollapsed={isCollapsed}>
            <BookOpenIcon />
          </NavLink>
        </nav>
      </aside>
    </TooltipProvider>
  )
}
