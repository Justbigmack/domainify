'use client'

import { PanelLeftIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSidebar } from './SidebarProvider'
import { SidebarTooltip } from './SidebarTooltip'

export const SidebarToggle = () => {
  const { isCollapsed, toggleSidebar } = useSidebar()

  return (
    <SidebarTooltip label="Expand sidebar">
      <button
        type="button"
        onClick={toggleSidebar}
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className={cn(
          'absolute top-0 right-0 flex h-9 items-center justify-center rounded-md text-muted-foreground outline-none transition-[translate,width,color,background-color] duration-200 ease-in-out hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground focus-visible:ring-3 focus-visible:ring-ring/50 motion-reduce:transition-none',
          { 'w-10 translate-y-10': isCollapsed, 'w-9 translate-y-0': !isCollapsed },
        )}
      >
        <PanelLeftIcon className="size-4" />
      </button>
    </SidebarTooltip>
  )
}
