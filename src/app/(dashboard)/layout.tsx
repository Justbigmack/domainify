import { Suspense } from 'react'
import type { PropsWithChildren } from 'react'
import { cookies } from 'next/headers'
import { BookOpenIcon, GlobeIcon, SettingsIcon } from 'lucide-react'
import { MobileNav } from '@/components/brand/MobileNav'
import {
  NavLink,
  Sidebar,
  SidebarHeader,
  SidebarNav,
  SidebarProvider,
  SidebarToggle,
  SIDEBAR_COLLAPSED_COOKIE,
} from '@/components/brand/Sidebar'
import { SessionUserMenu, UserMenuSkeleton } from '@/components/brand/UserMenu'

const DashboardLayout = async ({ children }: PropsWithChildren) => {
  const cookieStore = await cookies()
  const isSidebarCollapsed = cookieStore.get(SIDEBAR_COLLAPSED_COOKIE)?.value === 'true'

  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <SidebarProvider defaultCollapsed={isSidebarCollapsed}>
        <Sidebar>
          <SidebarHeader>
            <Suspense fallback={<UserMenuSkeleton />}>
              <SessionUserMenu />
            </Suspense>
            <SidebarToggle />
          </SidebarHeader>
          <SidebarNav label="Main" className="pt-4">
            <NavLink href="/domains" label="Domains">
              <GlobeIcon />
            </NavLink>
            <NavLink href="/settings/general" label="Settings">
              <SettingsIcon />
            </NavLink>
            <NavLink href="/docs" label="Docs">
              <BookOpenIcon />
            </NavLink>
          </SidebarNav>
        </Sidebar>
      </SidebarProvider>
      <MobileNav />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  )
}

export default DashboardLayout
