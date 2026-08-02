import { Suspense } from 'react'
import type { PropsWithChildren } from 'react'
import { DashboardSidebarNav } from '@/app/(dashboard)/_components/DashboardSidebarNav'
import { MobileNav } from '@/components/brand/MobileNav'
import { Sidebar, SidebarHeader, SidebarProvider, SidebarToggle } from '@/components/brand/Sidebar'
import { SessionUserMenu, UserMenuSkeleton } from '@/lib/auth/_components/UserMenu'
import { Skeleton } from '@/components/ui/skeleton'

const SIDEBAR_NAV_SKELETON_ROWS = 3

const SidebarNavFallback = () => (
  <div aria-busy className="flex flex-1 flex-col gap-1 px-3 pt-4">
    {Array.from({ length: SIDEBAR_NAV_SKELETON_ROWS }, (_, index) => (
      <Skeleton key={index} className="h-9 rounded-md" />
    ))}
  </div>
)

const MobileNavFallback = () => (
  <header className="sticky top-0 z-40 h-14 shrink-0 border-b bg-background/90 backdrop-blur md:hidden" />
)

const DashboardLayout = ({ children }: PropsWithChildren) => (
  <div className="flex min-h-dvh flex-col md:flex-row">
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <Suspense fallback={<UserMenuSkeleton />}>
            <SessionUserMenu />
          </Suspense>
          <SidebarToggle />
        </SidebarHeader>
        <Suspense fallback={<SidebarNavFallback />}>
          <DashboardSidebarNav />
        </Suspense>
      </Sidebar>
      <Suspense fallback={<MobileNavFallback />}>
        <MobileNav />
      </Suspense>
    </SidebarProvider>
    <main className="flex min-w-0 flex-1 flex-col">{children}</main>
  </div>
)

export default DashboardLayout
