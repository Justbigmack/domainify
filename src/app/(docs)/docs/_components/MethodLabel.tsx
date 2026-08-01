import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { ApiMethod } from '@/lib/domains/apiSnippets'

export const METHOD_BADGE_CLASSES: Record<ApiMethod, string> = {
  GET: 'bg-info/10 text-info',
  POST: 'bg-success/10 text-success',
  DELETE: 'bg-destructive/10 text-destructive',
}

const METHOD_TEXT_CLASSES: Record<ApiMethod, string> = {
  GET: 'text-info',
  POST: 'text-success',
  DELETE: 'text-destructive',
}

type MethodLabelProps = {
  method: ApiMethod
  className?: string
}

export const MethodLabel = ({ method, className }: MethodLabelProps) => (
  <span
    className={cn(
      'font-mono text-[0.625rem] font-semibold tracking-wide',
      METHOD_TEXT_CLASSES[method],
      className,
    )}
  >
    {method}
  </span>
)

export const MethodBadge = ({ method, className }: MethodLabelProps) => (
  <Badge
    variant="outline"
    className={cn(
      'rounded-md border-transparent font-mono font-semibold',
      METHOD_BADGE_CLASSES[method],
      className,
    )}
  >
    {method}
  </Badge>
)
