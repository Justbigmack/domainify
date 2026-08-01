import type { PropsWithChildren } from 'react'
import { cn } from '@/lib/utils'

type SidebarNavProps = PropsWithChildren<{
  label: string
  className?: string
}>

export const SidebarNav = ({ label, className, children }: SidebarNavProps) => (
  <nav aria-label={label} className={cn('flex flex-1 flex-col gap-1 px-3', className)}>
    {children}
  </nav>
)
