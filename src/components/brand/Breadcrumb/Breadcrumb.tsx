import type { PropsWithChildren } from 'react'
import { cn } from '@/lib/utils'

type BreadcrumbProps = PropsWithChildren<{
  className?: string
}>

export const Breadcrumb = ({ children, className }: BreadcrumbProps) => (
  <nav aria-label="Breadcrumb" className={cn('flex min-w-0 items-center gap-1.5', className)}>
    {children}
  </nav>
)
