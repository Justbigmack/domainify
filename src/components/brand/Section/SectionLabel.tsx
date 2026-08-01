import type { ComponentProps } from 'react'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export const SectionLabel = ({ className, ...props }: ComponentProps<typeof Label>) => (
  <Label className={cn('gap-1.5 text-sm leading-normal font-medium', className)} {...props} />
)
