import { Suspense } from 'react'
import type { PropsWithChildren } from 'react'
import { cookies } from 'next/headers'
import { DashboardSidebarNav } from '@/app/(dashboard)/_components/DashboardSidebarNav'
import { MobileNav } from '@/components/brand/MobileNav'
import {
  Sidebar,
  SidebarHeader,
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
          <DashboardSidebarNav />
        </Sidebar>
      </SidebarProvider>
      <MobileNav />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  )
}

export default DashboardLayout
