import type { PropsWithChildren } from 'react'
import { cn } from '@/lib/utils'

type SectionRowTextProps = PropsWithChildren<{ className?: string }>

export const SectionRowText = ({ className, children }: SectionRowTextProps) => (
  <div
    className={cn('min-w-0 flex-1 group-data-[layout=inline]/section-row:max-w-[65%]', className)}
  >
    {children}
  </div>
)
