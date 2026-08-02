import type { PropsWithChildren } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

type TextLinkProps = PropsWithChildren<{
  href: string
  className?: string
}>

export const TextLink = ({ href, className, children }: TextLinkProps) => (
  <Link
    href={href}
    className={cn(
      'rounded-xs font-medium text-foreground underline decoration-border underline-offset-2 transition-colors outline-none hover:decoration-foreground focus-visible:ring-3 focus-visible:ring-ring/50',
      className,
    )}
  >
    {children}
  </Link>
)
