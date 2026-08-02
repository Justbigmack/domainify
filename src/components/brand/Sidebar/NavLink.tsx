'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { PropsWithChildren } from 'react'
import { cn } from '@/lib/utils'
import { SidebarTooltip } from './SidebarTooltip'

export const SIDEBAR_ROW_CLASS =
  'flex h-9 items-center gap-2.5 overflow-hidden rounded-md px-3 text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 [&_svg]:size-4 [&_svg]:shrink-0'

export const SIDEBAR_LABEL_CLASS =
  'truncate opacity-100 transition-opacity duration-200 ease-in-out sidebar-collapsed:opacity-0 motion-reduce:transition-none'

type NavLinkProps = PropsWithChildren<{
  href: string
  label: string
}>

export const NavLink = ({ href, label, children }: NavLinkProps) => {
  const pathname = usePathname()
  const isActive = pathname === href || pathname.startsWith(`${href}/`)

  return (
    <SidebarTooltip label={label}>
      <Link
        href={href}
        aria-current={isActive ? 'page' : undefined}
        className={cn(SIDEBAR_ROW_CLASS, {
          'bg-sidebar-accent text-sidebar-accent-foreground': isActive,
          'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground':
            !isActive,
        })}
      >
        {children}
        <span className={SIDEBAR_LABEL_CLASS}>{label}</span>
      </Link>
    </SidebarTooltip>
  )
}
