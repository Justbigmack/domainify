'use client'

import type { ReactElement } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useSidebar } from './SidebarProvider'

type SidebarTooltipProps = {
  label: string
  children: ReactElement
}

export const SidebarTooltip = ({ label, children }: SidebarTooltipProps) => {
  const { isCollapsed } = useSidebar()

  return (
    <Tooltip disabled={!isCollapsed}>
      <TooltipTrigger render={children} />
      <TooltipContent side="right" sideOffset={8}>
        {label}
      </TooltipContent>
    </Tooltip>
  )
}
