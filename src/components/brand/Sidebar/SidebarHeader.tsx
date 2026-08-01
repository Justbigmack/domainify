'use client'

import type { PropsWithChildren } from 'react'
import { cn } from '@/lib/utils'
import { useSidebar } from './SidebarProvider'

export const SidebarHeader = ({ children }: PropsWithChildren) => {
  const { isCollapsed } = useSidebar()

  return (
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
        {children}
      </div>
    </div>
  )
}
