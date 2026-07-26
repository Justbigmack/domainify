import type { PropsWithChildren } from 'react'
import { CheckIcon } from '@/components/icons'
import { cn } from '@/lib/cn'

export type StepState = 'done' | 'active' | 'upcoming'

const CIRCLE_CLASSES: Record<StepState, string> = {
  done: 'border-success bg-success-soft text-success',
  active: 'border-border-strong bg-surface text-ink',
  upcoming: 'border-border bg-surface text-ink-subtle',
}

type StepperStepProps = PropsWithChildren<{
  index: number
  title: string
  state: StepState
  isLast?: boolean
}>

export const StepperStep = ({ index, title, state, isLast = false, children }: StepperStepProps) => (
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
      <h2
        className={cn('pt-1 text-base font-semibold tracking-tight', {
          'text-ink-subtle': state === 'upcoming',
        })}
      >
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </div>
  </li>
)

export const Stepper = ({ children }: PropsWithChildren) => (
  <ol className="flex flex-col">{children}</ol>
)
