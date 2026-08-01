import type { PropsWithChildren } from 'react'
import { cn } from '@/lib/utils'

type SectionHeaderProps = PropsWithChildren<{ className?: string }>

export const SectionHeader = ({ className, children }: SectionHeaderProps) => (
  <div className={cn('flex flex-col items-start gap-0.5 px-5', className)}>{children}</div>
)
