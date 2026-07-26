'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { PropsWithChildren } from 'react'
import { cn } from '@/lib/cn'

type NavLinkProps = PropsWithChildren<{ href: string }>

export const NavLink = ({ href, children }: NavLinkProps) => {
  const pathname = usePathname()
  const isActive = pathname === href || pathname.startsWith(`${href}/`)

  return (
    <Link
      href={href}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'flex h-10 items-center gap-2.5 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
        {
          'bg-surface-muted text-ink': isActive,
          'text-ink-muted hover:bg-surface-muted/60 hover:text-ink': !isActive,
        },
      )}
    >
      {children}
    </Link>
  )
}
