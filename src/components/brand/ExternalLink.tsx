import type { AnchorHTMLAttributes } from 'react'
import { ArrowUpRightIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type ExternalLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }

export const ExternalLink = ({ className, children, ...props }: ExternalLinkProps) => (
  <a
    target="_blank"
    rel="noreferrer"
    className={cn(
      'inline-flex items-center gap-0.5 rounded-xs font-medium text-foreground underline-offset-2 transition-colors outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50',
      className,
    )}
    {...props}
  >
    {children}
    <ArrowUpRightIcon aria-hidden className="size-3.5 shrink-0" />
    <span className="sr-only">(opens in a new tab)</span>
  </a>
)
