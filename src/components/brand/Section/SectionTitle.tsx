import type { PropsWithChildren } from 'react'
import { Heading } from '@/components/brand/Heading'
import { cn } from '@/lib/utils'

type SectionTitleProps = PropsWithChildren<{ className?: string }>

export const SectionTitle = ({ className, children }: SectionTitleProps) => (
  <Heading as="h2" size="h4" className={cn('tabular-nums', className)}>
    {children}
  </Heading>
)
