import type { PropsWithChildren } from 'react'
import { cn } from '@/lib/utils'

type SectionToolbarProps = PropsWithChildren<{ className?: string }>

export const SectionToolbar = ({ className, children }: SectionToolbarProps) => (
  <div
    className={cn(
      'flex items-center justify-between gap-4 border-b border-border/50 px-5 py-3',
      className,
    )}
  >
    {children}
  </div>
)
