'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Accordion } from '@base-ui/react/accordion'
import { ArrowUpRightIcon, ChevronDownIcon, Trash2Icon } from 'lucide-react'
import { RemoveDomainDialog } from '@/app/(dashboard)/domains/_components/RemoveDomainDialog'
import { StatusTag } from '@/components/brand/StatusTag'
import { Text } from '@/components/brand/Text'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { DomainListItem } from '@/app/(dashboard)/domains/_components/DomainsTable'
import { formatRelativeTime, formatShortDate } from '@/lib/formatTime'

const PANEL_CLASS =
  'h-[var(--accordion-panel-height)] overflow-hidden transition-[height] duration-200 ease-out data-starting-style:h-0 data-ending-style:h-0 motion-reduce:transition-none'

const TRIGGER_FOCUS_CLASS =
  'outline-none focus-visible:relative focus-visible:z-10 focus-visible:ring-3 focus-visible:ring-ring/50'

type MetaRowProps = {
  label: string
  value: string
}

const MetaRow = ({ label, value }: MetaRowProps) => (
  <div className="flex items-baseline justify-between gap-4">
    <Text as="span" variant="secondary">
      {label}
    </Text>
    <Text as="span" variant="secondary" className="text-foreground" suppressHydrationWarning>
      {value}
    </Text>
  </div>
)

type DomainMobileItemProps = {
  item: DomainListItem
  nowMs: number
  isFirst: boolean
}

const DomainMobileItem = ({ item, nowMs, isFirst }: DomainMobileItemProps) => {
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false)

  const handleRequestRemove = () => {
    setIsRemoveDialogOpen(true)
  }

  return (
    <Accordion.Item className={cn({ 'border-t border-border/40': !isFirst })}>
      <Accordion.Header className="m-0">
        <Accordion.Trigger
          className={cn(
            'group flex w-full items-center gap-3 px-5 py-4 text-left',
            TRIGGER_FOCUS_CLASS,
          )}
        >
          <Text as="span" className="min-w-0 flex-1 truncate font-medium">
            {item.hostname}
          </Text>
          <StatusTag status={item.status} className="ml-0 shrink-0" />
          <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 ease-out group-data-panel-open:rotate-180 motion-reduce:transition-none" />
        </Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Panel className={PANEL_CLASS}>
        <div className="flex flex-col gap-2.5 px-5 pb-4">
          <MetaRow label="Created" value={formatShortDate(item.createdAt)} />
          <MetaRow
            label="Last checked"
            value={item.lastCheckedAt ? formatRelativeTime(item.lastCheckedAt, nowMs) : 'Never'}
          />
          <div className="-mr-2.5 mt-1 flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={handleRequestRemove}
            >
              <Trash2Icon data-icon="inline-start" />
              Remove
            </Button>
            <Button
              variant="ghost"
              size="sm"
              nativeButton={false}
              render={<Link href={`/domains/${item.id}`} />}
            >
              <ArrowUpRightIcon data-icon="inline-start" />
              View details
            </Button>
          </div>
        </div>
      </Accordion.Panel>
      <RemoveDomainDialog
        domainId={item.id}
        hostname={item.hostname}
        open={isRemoveDialogOpen}
        onOpenChange={setIsRemoveDialogOpen}
      />
    </Accordion.Item>
  )
}

type DomainsMobileListProps = {
  items: DomainListItem[]
  nowMs: number
  className?: string
}

export const DomainsMobileList = ({ items, nowMs, className }: DomainsMobileListProps) => {
  if (items.length === 0) {
    return (
      <Text
        as="div"
        className={cn(
          'rounded-xl border border-border/50 bg-card px-5 py-10 text-center text-muted-foreground',
          className,
        )}
      >
        No domains match your filters.
      </Text>
    )
  }

  return (
    <Accordion.Root
      multiple
      className={cn('overflow-hidden rounded-xl border border-border/50 bg-card', className)}
    >
      {items.map((item, index) => (
        <DomainMobileItem key={item.id} item={item} nowMs={nowMs} isFirst={index === 0} />
      ))}
    </Accordion.Root>
  )
}
