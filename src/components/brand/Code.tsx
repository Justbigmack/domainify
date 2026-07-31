import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export const Code = ({ className, ...props }: HTMLAttributes<HTMLElement>) => (
  <code
    className={cn(
      'rounded-sm bg-muted px-1 py-0.5 font-mono text-[0.75rem] text-foreground',
      className,
    )}
    {...props}
  />
)
