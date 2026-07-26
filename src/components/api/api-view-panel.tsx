'use client'

import { useRef, useState } from 'react'
import type { MouseEvent } from 'react'
import { ApiOperationBlock } from '@/components/api/api-operation-block'
import { CodeIcon, XIcon } from '@/components/icons'
import { buttonClassName } from '@/components/ui/button'
import { cn } from '@/lib/cn'
import {
  buildCollectionOperations,
  buildDomainOperations,
  sessionCookieName,
} from '@/lib/domains/api-snippets'
import type { ApiSnippetKind, ApiTarget } from '@/lib/domains/api-snippets'

const SNIPPET_KINDS = ['curl', 'fetch'] as const

const SNIPPET_KIND_LABELS: Record<ApiSnippetKind, string> = {
  curl: 'cURL',
  fetch: 'fetch',
}

type ApiViewPanelProps =
  | { scope: 'collection'; target: ApiTarget | null }
  | { scope: 'domain'; target: ApiTarget }

export const ApiViewPanel = ({ scope, target }: ApiViewPanelProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [origin, setOrigin] = useState('')
  const [snippetKind, setSnippetKind] = useState<ApiSnippetKind>('curl')

  const operations =
    scope === 'collection'
      ? buildCollectionOperations(origin, target)
      : buildDomainOperations(origin, target)

  const handleOpen = () => {
    setOrigin(window.location.origin)
    setIsOpen(true)
    dialogRef.current?.showModal()
  }

  const handleCloseClick = () => {
    dialogRef.current?.close()
  }

  const handleDialogClose = () => {
    setIsOpen(false)
  }

  const handleBackdropClick = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === dialogRef.current) dialogRef.current?.close()
  }

  const handleSnippetKindChange = (kind: ApiSnippetKind) => () => {
    setSnippetKind(kind)
  }

  return (
    <>
      <button type="button" onClick={handleOpen} className={buttonClassName('secondary')}>
        <CodeIcon className="size-4" />
        API
      </button>
      <dialog
        ref={dialogRef}
        onClose={handleDialogClose}
        onClick={handleBackdropClick}
        aria-labelledby="api-view-panel-title"
        className="fixed inset-y-0 right-0 left-auto m-0 h-full max-h-none w-full max-w-lg overflow-y-auto border-l border-border bg-canvas p-0 text-ink transition-[opacity,translate] duration-200 ease-out backdrop:bg-black/40 open:translate-x-0 open:opacity-100 starting:open:translate-x-8 starting:open:opacity-0 motion-reduce:transition-none"
      >
        {isOpen && (
          <div className="flex min-h-full flex-col gap-5 p-6">
            <header className="flex items-start justify-between gap-3">
              <div>
                <h2 id="api-view-panel-title" className="text-base font-semibold tracking-tight">
                  Use the API
                </h2>
                <p className="mt-1 text-sm leading-6 text-ink-muted">
                  Everything this page does is plain HTTP — the UI and these endpoints call the
                  same service functions.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseClick}
                aria-label="Close API panel"
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-ink-subtle transition-colors hover:bg-surface-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              >
                <XIcon className="size-4" />
              </button>
            </header>
            <div className="flex flex-col gap-2">
              <div
                className="inline-flex self-start rounded-lg border border-border p-0.5"
                role="group"
                aria-label="Snippet format"
              >
                {SNIPPET_KINDS.map((kind) => (
                  <button
                    key={kind}
                    type="button"
                    onClick={handleSnippetKindChange(kind)}
                    aria-pressed={snippetKind === kind}
                    className={cn(
                      'rounded-md px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
                      {
                        'bg-surface-muted text-ink': snippetKind === kind,
                        'text-ink-muted hover:text-ink': snippetKind !== kind,
                      },
                    )}
                  >
                    {SNIPPET_KIND_LABELS[kind]}
                  </button>
                ))}
              </div>
              <p className="rounded-lg border border-border bg-surface px-3 py-2.5 text-xs leading-5 text-ink-muted">
                {snippetKind === 'fetch'
                  ? 'fetch snippets run as-is in this tab’s DevTools console — your session cookie rides along automatically.'
                  : `curl authenticates with your session cookie: after signing in, copy the ${sessionCookieName(origin)} value from DevTools → Application → Cookies and replace <session-token>.`}
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
        )}
      </dialog>
    </>
  )
}
