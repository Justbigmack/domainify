import type { PropsWithChildren } from 'react'
import { CheckIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export type StepState = 'done' | 'active' | 'upcoming'

const CIRCLE_CLASSES: Record<StepState, string> = {
  done: 'border-success bg-success-subtle text-success',
  active: 'border-input bg-background text-foreground',
  upcoming: 'border-border bg-background text-muted-foreground',
}

type StepperStepProps = PropsWithChildren<{
  index: number
  state: StepState
}>

export const StepperStep = ({ index, state, children }: StepperStepProps) => (
  <li data-state={state} className="group/step flex gap-4">
    <div className="flex flex-col items-center">
      <span
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-medium',
          CIRCLE_CLASSES[state],
        )}
      >
        {state === 'done' ? <CheckIcon className="size-4" /> : index}
      </span>
      <span className="mt-2 w-px flex-1 bg-border group-last/step:hidden" aria-hidden />
    </div>
    <div className="min-w-0 flex-1 pb-10 group-last/step:pb-2">{children}</div>
  </li>
)
