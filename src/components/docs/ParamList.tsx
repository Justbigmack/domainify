import { cn } from '@/lib/utils'
import type { EndpointField } from '@/lib/docs/apiReference'

type ParamListProps = {
  fields: EndpointField[]
}

export const ParamList = ({ fields }: ParamListProps) => (
  <div className="overflow-hidden rounded-xl border border-border/50 bg-card">
    {fields.map((field, index) => (
      <div
        key={field.name}
        className={cn('flex flex-col gap-1 px-5 py-3.5', { 'border-t border-border/40': index > 0 })}
      >
        <div className="flex items-baseline gap-2">
          <code className="font-mono text-[0.8125rem] font-medium">{field.name}</code>
          <span className="text-xs text-muted-foreground">{field.type}</span>
          <span
            className={cn('text-xs', {
              'text-warning': field.required,
              'text-muted-foreground/70': !field.required,
            })}
          >
            {field.required ? 'required' : 'optional'}
          </span>
        </div>
        <p className="text-[0.8125rem] leading-6 text-muted-foreground">{field.description}</p>
      </div>
    ))}
  </div>
)
