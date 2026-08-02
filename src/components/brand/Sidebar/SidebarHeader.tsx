import type { PropsWithChildren } from 'react'

export const SidebarHeader = ({ children }: PropsWithChildren) => (
  <div className="relative mx-3 mt-8 h-9 pr-10 transition-[height,padding] duration-200 ease-in-out sidebar-collapsed:h-19 sidebar-collapsed:pr-0 motion-reduce:transition-none">
    {children}
  </div>
)
