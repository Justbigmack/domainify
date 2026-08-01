import Link from 'next/link'
import type { PropsWithChildren } from 'react'
import { cn } from '@/lib/utils'

type ProseProps = PropsWithChildren<{ className?: string }>

export const DocsP = ({ className, children }: ProseProps) => (
  <p className={cn('text-sm leading-6.5 text-muted-foreground', className)}>{children}</p>
)

export const DocsStrong = ({ children }: PropsWithChildren) => (
  <strong className="font-medium text-foreground">{children}</strong>
)

export const DocsCode = ({ children }: PropsWithChildren) => (
  <code className="rounded-sm bg-muted px-1 py-0.5 font-mono text-[0.75rem] text-foreground">
    {children}
  </code>
)

export const DocsUl = ({ className, children }: ProseProps) => (
  <ul
    className={cn(
      'flex list-disc flex-col gap-1.5 pl-5 text-sm leading-6.5 text-muted-foreground marker:text-muted-foreground/50',
      className,
    )}
  >
    {children}
  </ul>
)

export const DocsOl = ({ className, children }: ProseProps) => (
  <ol
    className={cn(
      'flex list-decimal flex-col gap-1.5 pl-5 text-sm leading-6.5 text-muted-foreground marker:text-muted-foreground/50',
      className,
    )}
  >
    {children}
  </ol>
)

type DocsLinkProps = PropsWithChildren<{ href: string }>

export const DocsLink = ({ href, children }: DocsLinkProps) => (
  <Link
    href={href}
    className="font-medium text-foreground underline decoration-border underline-offset-2 transition-colors outline-none hover:decoration-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
  >
    {children}
  </Link>
)
