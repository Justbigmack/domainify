import type { PropsWithChildren } from 'react'
import { cn } from '@/lib/utils'

type SectionProps = PropsWithChildren<{ className?: string }>

export const Section = ({ className, children }: SectionProps) => (
  <section className={cn('flex flex-col gap-3', className)}>{children}</section>
)
