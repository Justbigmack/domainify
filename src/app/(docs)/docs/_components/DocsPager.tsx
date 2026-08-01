'use client'

import Link from 'next/link'
import { Text } from '@/components/brand/Text'
import { usePathname } from 'next/navigation'
import { flattenDocsNav } from '@/app/(docs)/docs/_lib/nav'
import { cn } from '@/lib/utils'
import type { DocsNavItem } from '@/app/(docs)/docs/_lib/nav'

type PagerLinkProps = {
  item: DocsNavItem
  direction: 'previous' | 'next'
}

const PagerLink = ({ item, direction }: PagerLinkProps) => (
  <Link
    href={item.href}
    className={cn(
      'group flex flex-col gap-0.5 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
      { 'items-end text-right': direction === 'next' },
    )}
  >
    <Text as="span" variant="caption" className="text-muted-foreground/70">
      {direction === 'previous' ? 'Previous' : 'Next'}
    </Text>
    <Text as="span" className="font-medium text-muted-foreground transition-colors group-hover:text-foreground">
      {item.title}
    </Text>
  </Link>
)

export const DocsPager = () => {
  const pathname = usePathname()
  const items = flattenDocsNav()
  const currentIndex = items.findIndex((item) => item.href === pathname)
  if (currentIndex === -1) return null
  const previousItem = currentIndex > 0 ? items[currentIndex - 1] : null
  const nextItem = currentIndex < items.length - 1 ? items[currentIndex + 1] : null
  if (!previousItem && !nextItem) return null

  return (
    <div className="mt-14 flex items-start justify-between gap-4 border-t border-border/50 pt-5">
      {previousItem ? <PagerLink item={previousItem} direction="previous" /> : <span />}
      {nextItem ? <PagerLink item={nextItem} direction="next" /> : <span />}
    </div>
  )
}
