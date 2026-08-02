import { cn } from '@/lib/utils'
import { Text } from '@/components/brand/Text'
import type { EndpointField } from '@/lib/apiSurface/endpoints'

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
          <Text as="span" variant="caption">{field.type}</Text>
          <span
            className={cn('text-xs', {
              'font-medium text-muted-foreground': field.required,
              'text-muted-foreground/70': !field.required,
            })}
          >
            {field.required ? 'required' : 'optional'}
          </span>
        </div>
        <Text variant="secondary" className="leading-6">{field.description}</Text>
      </div>
    ))}
  </div>
)
