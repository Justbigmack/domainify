import { cn } from '@/lib/utils'

export const SECTION_TABLE_HEAD_CLASS = 'h-9 px-5 text-xs font-medium text-muted-foreground/80'

export const SECTION_TABLE_HEAD_DIVIDER_CLASS =
  'relative after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-border/40 first:after:left-5 last:after:right-5'
export const SECTION_TABLE_CELL_CLASS = 'px-5 py-3.5 text-sm'

export const sectionTableRowClass = (isLastRow: boolean) =>
  cn('hover:bg-transparent', { 'border-b-0': isLastRow, 'border-border/40': !isLastRow })
