import { MethodBadge } from '@/components/brand/MethodLabel'
import { CopyButton } from '@/components/brand/CopyButton'
import type { ApiOperation, ApiSnippetKind } from '@/lib/domains/apiSnippets'

type ApiOperationBlockProps = {
  operation: ApiOperation
  snippetKind: ApiSnippetKind
}

export const ApiOperationBlock = ({ operation, snippetKind }: ApiOperationBlockProps) => {
  const snippet = operation.snippets[snippetKind]
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <MethodBadge method={operation.method} />
        <code className="min-w-0 truncate font-mono text-xs" title={operation.path}>
          {operation.path}
        </code>
      </div>
      <p className="text-xs leading-5 text-muted-foreground">{operation.summary}</p>
      <div className="relative rounded-lg bg-muted">
        <pre className="overflow-x-auto px-3 py-2.5 pr-10 font-mono text-xs leading-5">
          <code>{snippet}</code>
        </pre>
        <CopyButton
          value={snippet}
          label={`Copy ${snippetKind} snippet for ${operation.method} ${operation.path}`}
          className="absolute top-1.5 right-1.5 bg-muted"
        />
      </div>
    </section>
  )
}
