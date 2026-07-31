'use client'

import { useState } from 'react'
import { CodeIcon } from 'lucide-react'
import { ApiOperationBlock } from '@/components/api/api-operation-block'
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
import Link from 'next/link'
import { buildCollectionOperations, buildDomainOperations } from '@/lib/domains/api-snippets'
import type { ApiSnippetKind, ApiTarget } from '@/lib/domains/api-snippets'

const SNIPPET_KIND_LABELS: Record<ApiSnippetKind, string> = {
  curl: 'cURL',
  fetch: 'fetch',
}

type ApiViewPanelProps =
  | { scope: 'collection'; target: ApiTarget | null }
  | { scope: 'domain'; target: ApiTarget }

export const ApiViewPanel = ({ scope, target }: ApiViewPanelProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [origin, setOrigin] = useState('')
  const [snippetKind, setSnippetKind] = useState<ApiSnippetKind>('curl')

  const operations =
    scope === 'collection'
      ? buildCollectionOperations(origin, target)
      : buildDomainOperations(origin, target)

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
              <Link href="/keys" className="font-medium text-foreground underline underline-offset-2">
                API keys
              </Link>{' '}
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
