'use client'

import { useState } from 'react'
import { Accordion } from '@base-ui/react/accordion'
import { ChevronDownIcon, Trash2Icon } from 'lucide-react'
import { RevokeKeyDialog } from '@/app/(dashboard)/settings/_components/RevokeKeyDialog'
import { Text } from '@/components/brand/Text'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ApiKeyListItem } from '@/app/(dashboard)/settings/_components/ApiKeysCard'
import { formatRelativeTime, formatShortDate } from '@/lib/formatTime'

const PANEL_CLASS =
  'h-[var(--accordion-panel-height)] overflow-hidden transition-[height] duration-200 ease-out data-starting-style:h-0 data-ending-style:h-0 motion-reduce:transition-none'

const TRIGGER_FOCUS_CLASS =
  'outline-none focus-visible:relative focus-visible:z-10 focus-visible:ring-3 focus-visible:ring-ring/50'

type MetaRowProps = {
  label: string
  value: string
  valueClassName?: string
}

const MetaRow = ({ label, value, valueClassName }: MetaRowProps) => (
  <div className="flex items-baseline justify-between gap-4">
    <Text as="span" variant="secondary">
      {label}
    </Text>
    <Text
      as="span"
      variant="secondary"
      className={cn('text-foreground', valueClassName)}
      suppressHydrationWarning
    >
      {value}
    </Text>
  </div>
)

type ApiKeyMobileItemProps = {
  item: ApiKeyListItem
  nowMs: number
  isFirst: boolean
}

const ApiKeyMobileItem = ({ item, nowMs, isFirst }: ApiKeyMobileItemProps) => {
  const [isRevokeDialogOpen, setIsRevokeDialogOpen] = useState(false)

  const handleRequestRevoke = () => {
    setIsRevokeDialogOpen(true)
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
            {item.name}
          </Text>
          <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 ease-out group-data-panel-open:rotate-180 motion-reduce:transition-none" />
        </Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Panel className={PANEL_CLASS}>
        <div className="flex flex-col gap-2.5 px-5 pb-4">
          <MetaRow
            label="Key"
            value={item.start ? `${item.start}…` : '••••'}
            valueClassName="font-mono"
          />
          <MetaRow label="Created" value={formatShortDate(item.createdAt)} />
          <MetaRow
            label="Last used"
            value={item.lastRequest ? formatRelativeTime(item.lastRequest, nowMs) : 'Never'}
          />
          <div className="-mr-2.5 mt-1 flex items-center justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={handleRequestRevoke}
            >
              <Trash2Icon data-icon="inline-start" />
              Revoke key
            </Button>
          </div>
        </div>
      </Accordion.Panel>
      <RevokeKeyDialog
        keyId={item.id}
        keyName={item.name}
        open={isRevokeDialogOpen}
        onOpenChange={setIsRevokeDialogOpen}
      />
    </Accordion.Item>
  )
}

type ApiKeysMobileListProps = {
  items: ApiKeyListItem[]
  nowMs: number
  className?: string
}

export const ApiKeysMobileList = ({ items, nowMs, className }: ApiKeysMobileListProps) => (
  <Accordion.Root multiple className={className}>
    {items.map((item, index) => (
      <ApiKeyMobileItem key={item.id} item={item} nowMs={nowMs} isFirst={index === 0} />
    ))}
  </Accordion.Root>
)
