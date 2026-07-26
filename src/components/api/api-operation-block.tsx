import { CopyButton } from '@/components/ui/copy-button'
import { cn } from '@/lib/cn'
import type { ApiMethod, ApiOperation, ApiSnippetKind } from '@/lib/domains/api-snippets'

const METHOD_CLASSES: Record<ApiMethod, string> = {
  GET: 'bg-info-soft text-info',
  POST: 'bg-success-soft text-success',
  DELETE: 'bg-danger-soft text-danger',
}

type ApiOperationBlockProps = {
  operation: ApiOperation
  snippetKind: ApiSnippetKind
}

export const ApiOperationBlock = ({ operation, snippetKind }: ApiOperationBlockProps) => {
  const snippet = operation.snippets[snippetKind]
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 font-mono text-xs font-semibold',
            METHOD_CLASSES[operation.method],
          )}
        >
          {operation.method}
        </span>
        <code className="min-w-0 truncate font-mono text-xs text-ink" title={operation.path}>
          {operation.path}
        </code>
      </div>
      <p className="text-xs leading-5 text-ink-muted">{operation.summary}</p>
      <div className="relative rounded-lg bg-surface-muted">
        <pre className="overflow-x-auto px-3 py-2.5 pr-10 font-mono text-xs leading-5">
          <code>{snippet}</code>
        </pre>
        <CopyButton
          value={snippet}
          label={`Copy ${snippetKind} snippet for ${operation.method} ${operation.path}`}
          className="absolute top-1.5 right-1.5 bg-surface-muted"
        />
      </div>
    </section>
  )
}
