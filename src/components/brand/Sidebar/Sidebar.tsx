'use client'

import type { PropsWithChildren } from 'react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

type SidebarProps = PropsWithChildren<{
  className?: string
}>

export const Sidebar = ({ className, children }: SidebarProps) => (
  <TooltipProvider>
    <aside
      className={cn(
        'sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-in-out sidebar-collapsed:w-16 motion-reduce:transition-none md:flex',
        className,
      )}
    >
      {children}
    </aside>
  </TooltipProvider>
)
