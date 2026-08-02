'use client'

import { useState } from 'react'
import { CodeIcon } from 'lucide-react'
import { ApiOperationBlock } from '@/app/(dashboard)/domains/_components/ApiOperationBlock'
import { TextLink } from '@/components/brand/TextLink'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { buildCollectionOperations, buildDomainOperations } from '@/lib/domains/apiSnippets'
import type { ApiSnippetKind } from '@/lib/domains/apiSnippets'

const SNIPPET_KIND_LABELS: Record<ApiSnippetKind, string> = {
  curl: 'cURL',
  fetch: 'fetch',
}

type ApiViewPanelProps = { scope: 'collection' } | { scope: 'domain'; domainId: string }

export const ApiViewPanel = (props: ApiViewPanelProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [origin, setOrigin] = useState('')
  const [snippetKind, setSnippetKind] = useState<ApiSnippetKind>('curl')

  const operations =
    props.scope === 'collection'
      ? buildCollectionOperations(origin)
      : buildDomainOperations(origin, props.domainId)

  const handleOpenChange = (open: boolean) => {
    if (open) setOrigin(window.location.origin)
    setIsOpen(open)
  }

  const handleSnippetKindChange = (groupValue: string[]) => {
    const nextKind = groupValue[0]
    if (nextKind === 'curl' || nextKind === 'fetch') setSnippetKind(nextKind)
  }

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger render={<Button variant="ghost" className="text-muted-foreground" />}>
        <CodeIcon data-icon="inline-start" />
        API
      </SheetTrigger>
      <SheetContent side="right" className="gap-0 overflow-y-auto data-[side=right]:sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Use the API</SheetTitle>
          <SheetDescription>
            Everything this page does is plain HTTP. The UI and these endpoints call the same
            service functions.
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-5 p-4 pt-2">
          <div className="flex flex-col gap-2">
            <ToggleGroup
              variant="outline"
              size="sm"
              spacing={0}
              value={[snippetKind]}
              onValueChange={handleSnippetKindChange}
              aria-label="Snippet format"
            >
              <ToggleGroupItem value="curl">{SNIPPET_KIND_LABELS.curl}</ToggleGroupItem>
              <ToggleGroupItem value="fetch">{SNIPPET_KIND_LABELS.fetch}</ToggleGroupItem>
            </ToggleGroup>
            <p className="rounded-lg border bg-card px-3 py-2.5 text-xs leading-5 text-muted-foreground">
              Snippets authenticate with an API key. Create one on the{' '}
              <TextLink href="/settings/api-keys">API keys</TextLink>{' '}
              page and replace {'<api-key>'}.
            </p>
          </div>
          <div className="flex flex-col gap-5">
            {operations.map((operation) => (
              <ApiOperationBlock
                key={operation.key}
                operation={operation}
                snippetKind={snippetKind}
              />
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
