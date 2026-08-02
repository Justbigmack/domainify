'use client'

import { createContext, useContext, useMemo, useState } from 'react'
import type { PropsWithChildren } from 'react'
import {
  SIDEBAR_COLLAPSED_ATTRIBUTE,
  SIDEBAR_COLLAPSED_COOKIE,
  SIDEBAR_COOKIE_MAX_AGE_SECONDS,
} from './sidebarCookie'

type SidebarContextValue = {
  isCollapsed: boolean
  toggleSidebar: () => void
}

const SidebarContext = createContext<SidebarContextValue>({
  isCollapsed: false,
  toggleSidebar: () => undefined,
})

export const useSidebar = () => useContext(SidebarContext)

const readCollapsedAttribute = (): boolean =>
  typeof document !== 'undefined' &&
  document.documentElement.getAttribute(SIDEBAR_COLLAPSED_ATTRIBUTE) === 'true'

export const SidebarProvider = ({ children }: PropsWithChildren) => {
  const [isCollapsed, setIsCollapsed] = useState(readCollapsedAttribute)

  const contextValue = useMemo(() => {
    const toggleSidebar = () => {
      const nextCollapsed = !isCollapsed
      setIsCollapsed(nextCollapsed)
      document.documentElement.setAttribute(SIDEBAR_COLLAPSED_ATTRIBUTE, String(nextCollapsed))
      document.cookie = `${SIDEBAR_COLLAPSED_COOKIE}=${nextCollapsed}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE_SECONDS}`
    }
    return { isCollapsed, toggleSidebar }
  }, [isCollapsed])

  return <SidebarContext.Provider value={contextValue}>{children}</SidebarContext.Provider>
}
