import type { PropsWithChildren } from 'react'
import { Heading } from '@/components/brand/Heading'
import { cn } from '@/lib/utils'

type StepperTitleProps = PropsWithChildren<{ className?: string }>

export const StepperTitle = ({ className, children }: StepperTitleProps) => (
  <Heading
    as="h2"
    size="h3"
    className={cn('text-base group-data-[state=upcoming]/step:text-muted-foreground', className)}
  >
    {children}
  </Heading>
)
