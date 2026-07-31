import { CopyButton } from '@/components/brand/CopyButton'
import { cn } from '@/lib/utils'

type CodeBlockProps = {
  code: string
  label: string
  title?: string
  className?: string
}

export const CodeBlock = ({ code, label, title, className }: CodeBlockProps) => (
  <div className={cn('overflow-hidden rounded-lg bg-muted', className)}>
    {title ? (
      <div className="border-b border-border/50 px-4 py-2 font-mono text-xs text-muted-foreground">
        {title}
      </div>
    ) : null}
    <div className="relative">
      <pre className="overflow-x-auto px-4 py-3 pr-12 font-mono text-xs leading-5">
        <code>{code}</code>
      </pre>
      <CopyButton value={code} label={label} className="absolute top-1.5 right-1.5 bg-muted" />
    </div>
  </div>
)
