import type { PropsWithChildren } from 'react'
import { cn } from '@/lib/utils'

type SectionRowProps = PropsWithChildren<{
  layout?: 'inline' | 'stacked'
  alignment?: 'center' | 'top'
  density?: 'default' | 'compact'
  className?: string
}>

export const SectionRow = ({
  layout = 'inline',
  alignment = 'center',
  density = 'default',
  className,
  children,
}: SectionRowProps) => {
  const isStacked = layout === 'stacked'
  return (
    <div
      data-layout={layout}
      className={cn(
        'group/section-row px-5',
        {
          'py-3.5': density === 'default',
          'py-2.5': density === 'compact',
          'flex justify-between gap-4': !isStacked,
          'items-center': !isStacked && alignment === 'center',
          'items-start': !isStacked && alignment === 'top',
          'flex flex-col gap-1.5': isStacked,
        },
        className,
      )}
    >
      {children}
    </div>
  )
}
