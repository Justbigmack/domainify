'use client'

import Link from 'next/link'
import { Text } from '@/components/brand/Text'
import { usePathname } from 'next/navigation'
import { DOCS_NAV } from '@/app/(docs)/docs/_lib/nav'
import { cn } from '@/lib/utils'
import { MethodLabel } from '@/components/brand/MethodLabel'

type DocsNavListProps = {
  onNavigate?: () => void
}

export const DocsNavList = ({ onNavigate }: DocsNavListProps) => {
  const pathname = usePathname()

  return (
    <nav aria-label="Documentation" className="flex flex-col px-3 pb-6">
      {DOCS_NAV.map((group) => (
        <div key={group.title} className="flex flex-col gap-0.5">
          <Text variant="caption" className="px-3 pt-6 pb-1.5 font-medium text-muted-foreground/70">
            {group.title}
          </Text>
          {group.items.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex h-8 touch-manipulation items-center gap-2 rounded-md px-3 text-[0.8125rem] transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                  {
                    'bg-sidebar-accent text-sidebar-accent-foreground': isActive,
                    'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground':
                      !isActive,
                  },
                )}
              >
                <span className="truncate">{item.title}</span>
                {item.method ? <MethodLabel method={item.method} className="ml-auto" /> : null}
              </Link>
            )
          })}
        </div>
      ))}
    </nav>
  )
}
