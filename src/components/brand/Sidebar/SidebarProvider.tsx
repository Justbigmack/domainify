'use client'

import { createContext, useContext, useMemo, useState } from 'react'
import type { PropsWithChildren } from 'react'
import { SIDEBAR_COLLAPSED_COOKIE, SIDEBAR_COOKIE_MAX_AGE_SECONDS } from './sidebarCookie'

type SidebarContextValue = {
  isCollapsed: boolean
  toggleSidebar: () => void
}

const SidebarContext = createContext<SidebarContextValue>({
  isCollapsed: false,
  toggleSidebar: () => undefined,
})

export const useSidebar = () => useContext(SidebarContext)

type SidebarProviderProps = PropsWithChildren<{
  defaultCollapsed: boolean
}>

export const SidebarProvider = ({ defaultCollapsed, children }: SidebarProviderProps) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)

  const contextValue = useMemo(() => {
    const toggleSidebar = () => {
      const nextCollapsed = !isCollapsed
      setIsCollapsed(nextCollapsed)
      document.cookie = `${SIDEBAR_COLLAPSED_COOKIE}=${nextCollapsed}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE_SECONDS}`
    }
    return { isCollapsed, toggleSidebar }
  }, [isCollapsed])

  return <SidebarContext.Provider value={contextValue}>{children}</SidebarContext.Provider>
}
