import type { PropsWithChildren } from 'react'
import { cn } from '@/lib/utils'

type SectionContentProps = PropsWithChildren<{ className?: string }>

export const SectionContent = ({ className, children }: SectionContentProps) => (
  <div className={cn('overflow-hidden rounded-xl border border-border/50 bg-card', className)}>
    {children}
  </div>
)
