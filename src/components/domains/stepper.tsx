import type { PropsWithChildren, ReactNode } from 'react'
import { CheckIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export type StepState = 'done' | 'active' | 'upcoming'

const CIRCLE_CLASSES: Record<StepState, string> = {
  done: 'border-success bg-success/10 text-success',
  active: 'border-input bg-background text-foreground',
  upcoming: 'border-border bg-background text-muted-foreground',
}

type StepperStepProps = PropsWithChildren<{
  index: number
  title: string
  state: StepState
  aside?: ReactNode
  isLast?: boolean
}>

export const StepperStep = ({
  index,
  title,
  state,
  aside,
  isLast = false,
  children,
}: StepperStepProps) => (
  <li className="flex gap-4">
    <div className="flex flex-col items-center">
      <span
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-medium',
          CIRCLE_CLASSES[state],
        )}
      >
        {state === 'done' ? <CheckIcon className="size-4" /> : index}
      </span>
      {!isLast && <span className="mt-2 w-px flex-1 bg-border" aria-hidden />}
    </div>
    <div className={cn('min-w-0 flex-1 pb-10', { 'pb-2': isLast })}>
      <div className="flex min-w-0 items-baseline gap-3 px-5 pt-1">
        <h2
          className={cn('text-base font-semibold tracking-tight', {
            'text-muted-foreground': state === 'upcoming',
          })}
        >
          {title}
        </h2>
        {aside}
      </div>
      {children && <div className="mt-4">{children}</div>}
    </div>
  </li>
)

export const Stepper = ({ children }: PropsWithChildren) => (
  <ol className="flex flex-col">{children}</ol>
)
