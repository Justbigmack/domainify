import type { PropsWithChildren } from 'react'

export const Stepper = ({ children }: PropsWithChildren) => (
  <ol className="flex flex-col">{children}</ol>
)
