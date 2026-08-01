'use client'

import Link from 'next/link'
import { Text } from '@/components/brand/Text'
import { useState } from 'react'
import { CopyButton } from '@/components/brand/CopyButton'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { buildCollectionOperations } from '@/lib/domains/apiSnippets'
import type { ApiSnippetKind } from '@/lib/domains/apiSnippets'
import { DOCS_API_ORIGIN } from '@/app/(docs)/docs/_lib/constants'

const SNIPPET_KIND_LABELS: Record<ApiSnippetKind, string> = {
  curl: 'cURL',
  fetch: 'fetch',
}

type EndpointSnippetsProps = {
  operationKey: string
}

export const EndpointSnippets = ({ operationKey }: EndpointSnippetsProps) => {
  const [snippetKind, setSnippetKind] = useState<ApiSnippetKind>('curl')

  const operation = buildCollectionOperations(DOCS_API_ORIGIN, null).find(
    (candidate) => candidate.key === operationKey,
  )
  if (!operation) return null
  const snippet = operation.snippets[snippetKind]

  const handleSnippetKindChange = (groupValue: string[]) => {
    const nextKind = groupValue[0]
    if (nextKind === 'curl' || nextKind === 'fetch') setSnippetKind(nextKind)
  }

  return (
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
      <div className="relative rounded-lg bg-muted">
        <pre className="overflow-x-auto px-4 py-3 pr-12 font-mono text-xs leading-5">
          <code>{snippet}</code>
        </pre>
        <CopyButton
          value={snippet}
          label={`Copy ${snippetKind} snippet for ${operation.method} ${operation.path}`}
          className="absolute top-1.5 right-1.5 bg-muted"
        />
      </div>
      <Text variant="caption" className="leading-5">
        Replace {'<api-key>'} with a key from{' '}
        <Link
          href="/settings/api-keys"
          className="font-medium text-foreground underline underline-offset-2"
        >
          Settings → API keys
        </Link>
        .
      </Text>
    </div>
  )
}
