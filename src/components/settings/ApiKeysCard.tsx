'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { KeyRoundIcon, PlusIcon } from 'lucide-react'
import { GhostButton } from '@/components/brand/GhostButton'
import { Settings, SETTINGS_TABLE_CELL_CLASS, SETTINGS_TABLE_HEAD_CLASS, settingsTableRowClass } from '@/components/brand/Settings'
import { ApiKeyRowActions } from '@/components/settings/ApiKeyRowActions'
import { Button } from '@/components/ui/button'
import { CopyButton } from '@/components/ui/copy-button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { authClient } from '@/lib/authClient'
import { cn } from '@/lib/utils'
import { formatRelativeTime } from '@/lib/formatTime'

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

export const ApiKeysCard = ({ items }: ApiKeysCardProps) => {
  const router = useRouter()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [keyName, setKeyName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [createdKey, setCreatedKey] = useState<string | null>(null)
  const [nowMs] = useState(() => Date.now())

  const handleOpenForm = () => {
    setCreatedKey(null)
    setIsFormOpen(true)
  }

  const handleCancel = () => {
    setIsFormOpen(false)
    setKeyName('')
  }

  const handleDismissCreatedKey = () => setCreatedKey(null)

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setKeyName(event.target.value)
  }

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedName = keyName.trim()
    if (!trimmedName || isCreating) return
    setIsCreating(true)
    const { data } = await authClient.apiKey.create({ name: trimmedName })
    setIsCreating(false)
    if (!data) return
    setCreatedKey(data.key)
    setIsFormOpen(false)
    setKeyName('')
    router.refresh()
  }

  return (
    <Settings.Root>
      <Settings.Content>
        <Settings.Toolbar>
          <Settings.Description>
            Keys authenticate API requests via the Authorization header. A key grants full access
            to your domains.
          </Settings.Description>
          <GhostButton icon={PlusIcon} onClick={handleOpenForm} className="-mr-2.5 shrink-0">
            Create key
          </GhostButton>
        </Settings.Toolbar>
        {isFormOpen ? (
          <form
            onSubmit={handleCreate}
            className="flex items-center gap-3 border-b border-border/50 px-5 py-3"
          >
            <Input
              autoFocus
              value={keyName}
              onChange={handleNameChange}
              placeholder="Key name, e.g. Production"
              aria-label="Key name"
              className="flex-1"
            />
            <Button type="submit" size="sm" loading={isCreating} disabled={!keyName.trim()}>
              Create key
            </Button>
            <GhostButton onClick={handleCancel} className="-mr-2.5">
              Cancel
            </GhostButton>
          </form>
        ) : null}
        {createdKey ? (
          <Settings.Alert
            tone="info"
            icon={KeyRoundIcon}
            className="rounded-none border-x-0 border-t-0 border-b border-border/50 bg-info/[0.04]"
            action={
              <div className="flex items-center gap-1 self-center">
                <CopyButton value={createdKey} label="Copy the new API key" />
                <Settings.AlertAction onClick={handleDismissCreatedKey}>Done</Settings.AlertAction>
              </div>
            }
          >
            <span className="block font-mono text-xs break-all">{createdKey}</span>
            <span className="block pt-1 text-[0.8125rem]">
              Copy this key now — it is shown only once.
            </span>
          </Settings.Alert>
        ) : null}
        <Table>
          <TableHeader>
            <TableRow className="border-border/40 hover:bg-transparent">
              <TableHead className={SETTINGS_TABLE_HEAD_CLASS}>Name</TableHead>
              <TableHead className={cn(SETTINGS_TABLE_HEAD_CLASS, 'w-48')}>Key</TableHead>
              <TableHead className={cn(SETTINGS_TABLE_HEAD_CLASS, 'w-32')}>Created</TableHead>
              <TableHead className={cn(SETTINGS_TABLE_HEAD_CLASS, 'w-32')}>Last used</TableHead>
              <TableHead className={cn(SETTINGS_TABLE_HEAD_CLASS, 'w-24 text-right')}>
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={5} className="px-5 py-10 text-center text-muted-foreground">
                  No API keys yet. Create one to call the API.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item, index) => (
                <TableRow key={item.id} className={settingsTableRowClass(index === items.length - 1)}>
                  <TableCell className={cn(SETTINGS_TABLE_CELL_CLASS, 'font-medium')}>
                    {item.name}
                  </TableCell>
                  <TableCell className={cn(SETTINGS_TABLE_CELL_CLASS, 'font-mono text-xs text-muted-foreground')}>
                    {item.start ? `${item.start}…` : '••••'}
                  </TableCell>
                  <TableCell
                    className={cn(SETTINGS_TABLE_CELL_CLASS, 'text-muted-foreground tabular-nums')}
                    suppressHydrationWarning
                  >
                    {formatRelativeTime(item.createdAt, nowMs)}
                  </TableCell>
                  <TableCell
                    className={cn(SETTINGS_TABLE_CELL_CLASS, 'text-muted-foreground tabular-nums')}
                    suppressHydrationWarning
                  >
                    {item.lastRequest ? formatRelativeTime(item.lastRequest, nowMs) : '—'}
                  </TableCell>
                  <TableCell className={cn(SETTINGS_TABLE_CELL_CLASS, 'text-right')}>
                    <ApiKeyRowActions keyId={item.id} keyName={item.name} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Settings.Content>
    </Settings.Root>
  )
}
