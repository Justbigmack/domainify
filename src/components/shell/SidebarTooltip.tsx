'use client'

import type { ReactElement } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

type SidebarTooltipProps = {
  label: string
  isCollapsed: boolean
  children: ReactElement
}

export const SidebarTooltip = ({ label, isCollapsed, children }: SidebarTooltipProps) => (
  <Tooltip disabled={!isCollapsed}>
    <TooltipTrigger render={children} />
    <TooltipContent side="right" sideOffset={8}>
      {label}
    </TooltipContent>
  </Tooltip>
)
