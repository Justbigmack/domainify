'use client'

import { useEffect, useState } from 'react'
import { Text } from '@/components/brand/Text'
import { cn } from '@/lib/utils'

export type TocItem = {
  id: string
  title: string
}

type DocsTocProps = {
  items: TocItem[]
}

const OBSERVER_ROOT_MARGIN = '-80px 0px -70% 0px'

export const DocsToc = ({ items }: DocsTocProps) => {
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    const headings = items
      .map((item) => document.getElementById(item.id))
      .filter((element): element is HTMLElement => element !== null)
    if (headings.length === 0) return
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries.find((entry) => entry.isIntersecting)
        if (visibleEntry) setActiveId(visibleEntry.target.id)
      },
      { rootMargin: OBSERVER_ROOT_MARGIN },
    )
    headings.forEach((heading) => observer.observe(heading))
    return () => observer.disconnect()
  }, [items])

  return (
    <nav
      aria-label="On this page"
      className="sticky top-12 hidden w-48 shrink-0 self-start xl:block"
    >
      <Text variant="caption" className="px-2 font-medium text-muted-foreground/70">On this page</Text>
      <ul className="flex flex-col gap-0.5 pt-2">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={cn(
                'flex rounded-md px-2 py-1 text-[0.8125rem] leading-5 transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                {
                  'text-foreground': activeId === item.id,
                  'text-muted-foreground hover:text-foreground': activeId !== item.id,
                },
              )}
            >
              {item.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
