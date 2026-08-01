import { cn } from '@/lib/utils'

type SectionDividerProps = {
  fullBleed?: boolean
  className?: string
}

export const SectionDivider = ({ fullBleed = false, className }: SectionDividerProps) => (
  <hr className={cn('border-0 border-t border-border/50', { 'mx-5': !fullBleed }, className)} />
)
