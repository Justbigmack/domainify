import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type SectionProps = HTMLAttributes<HTMLElement>

export const Section = ({ className, children, ...props }: SectionProps) => (
  <section className={cn('flex flex-col gap-3', className)} {...props}>
    {children}
  </section>
)
