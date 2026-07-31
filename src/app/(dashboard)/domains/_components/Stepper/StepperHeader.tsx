import type { PropsWithChildren } from 'react'

export const StepperHeader = ({ children }: PropsWithChildren) => (
  <div className="flex min-w-0 items-baseline gap-3 px-5 pt-1">{children}</div>
)
