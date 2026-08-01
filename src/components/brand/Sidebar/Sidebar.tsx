'use client'

import type { PropsWithChildren } from 'react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useSidebar } from './SidebarProvider'

type SidebarProps = PropsWithChildren<{
  className?: string
}>

export const Sidebar = ({ className, children }: SidebarProps) => {
  const { isCollapsed } = useSidebar()

  return (
    <TooltipProvider>
      <aside
        className={cn(
          'sticky top-0 hidden h-dvh shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-in-out motion-reduce:transition-none md:flex',
          { 'w-16': isCollapsed, 'w-60': !isCollapsed },
          className,
        )}
      >
        {children}
      </aside>
    </TooltipProvider>
  )
}
