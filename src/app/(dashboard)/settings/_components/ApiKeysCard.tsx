'use client'

import { useState } from 'react'
import { PlusIcon } from 'lucide-react'
import { GhostButton } from '@/components/brand/GhostButton'
import {
  SECTION_TABLE_CELL_CLASS,
  SECTION_TABLE_HEAD_CLASS,
  Section,
  SectionContent,
  SectionDescription,
  SectionToolbar,
  sectionTableRowClass,
} from '@/components/brand/Section'
import { ApiKeyRowActions } from '@/app/(dashboard)/settings/_components/ApiKeyRowActions'
import { ApiKeysMobileList } from '@/app/(dashboard)/settings/_components/ApiKeysMobileList'
import { Text } from '@/components/brand/Text'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { formatRelativeTime, formatShortDate } from '@/lib/formatTime'

export type ApiKeyListItem = {
  id: string
  name: string
  start: string | null
  createdAt: string
  lastRequest: string | null
}

type ApiKeysCardProps = {
  items: ApiKeyListItem[]
}

const CREATE_KEY_HREF = '/settings/api-keys/new'

export const ApiKeysCard = ({ items }: ApiKeysCardProps) => {
  const [nowMs] = useState(() => Date.now())
  const countLabel = items.length === 1 ? '1 API key' : `${items.length} API keys`

  if (items.length === 0) {
    return (
      <Section>
        <SectionContent>
          <div className="flex items-center justify-between gap-4 px-5 py-4">
            <Text className="text-muted-foreground">No API keys</Text>
            <GhostButton icon={PlusIcon} href={CREATE_KEY_HREF} className="-mr-2.5 shrink-0">
              Create API key
            </GhostButton>
          </div>
        </SectionContent>
      </Section>
    )
  }

  return (
    <Section>
      <SectionContent>
        <SectionToolbar>
          <SectionDescription>{countLabel}</SectionDescription>
          <GhostButton icon={PlusIcon} href={CREATE_KEY_HREF} className="-mr-2.5 shrink-0">
            Create key
          </GhostButton>
        </SectionToolbar>
        <ApiKeysMobileList items={items} nowMs={nowMs} className="sm:hidden" />
        <div className="max-sm:hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border/40 hover:bg-transparent">
                <TableHead className={SECTION_TABLE_HEAD_CLASS}>Name</TableHead>
                <TableHead className={cn(SECTION_TABLE_HEAD_CLASS, 'w-48')}>Key</TableHead>
                <TableHead className={cn(SECTION_TABLE_HEAD_CLASS, 'w-32')}>Created</TableHead>
                <TableHead className={cn(SECTION_TABLE_HEAD_CLASS, 'w-32')}>Last used</TableHead>
                <TableHead className={cn(SECTION_TABLE_HEAD_CLASS, 'w-24 text-right')}>
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, index) => (
                <TableRow key={item.id} className={sectionTableRowClass(index === items.length - 1)}>
                  <TableCell className={SECTION_TABLE_CELL_CLASS}>
                    <Text as="span" className="font-medium">
                      {item.name}
                    </Text>
                  </TableCell>
                  <TableCell className={SECTION_TABLE_CELL_CLASS}>
                    <Text as="span" variant="caption" className="font-mono">
                      {item.start ? `${item.start}…` : '••••'}
                    </Text>
                  </TableCell>
                  <TableCell className={SECTION_TABLE_CELL_CLASS} suppressHydrationWarning>
                    <Text as="span" variant="secondary">
                      {formatShortDate(item.createdAt)}
                    </Text>
                  </TableCell>
                  <TableCell className={SECTION_TABLE_CELL_CLASS} suppressHydrationWarning>
                    <Text as="span" variant="secondary">
                      {item.lastRequest ? formatRelativeTime(item.lastRequest, nowMs) : '—'}
                    </Text>
                  </TableCell>
                  <TableCell className={cn(SECTION_TABLE_CELL_CLASS, 'text-right')}>
                    <ApiKeyRowActions keyId={item.id} keyName={item.name} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </SectionContent>
    </Section>
  )
}
