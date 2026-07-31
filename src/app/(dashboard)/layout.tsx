import type { PropsWithChildren } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { MobileNav } from '@/components/shell/MobileNav'
import { Sidebar } from '@/components/shell/Sidebar'
import { SIDEBAR_COLLAPSED_COOKIE } from '@/components/shell/sidebarCookie'
import { getSessionUser } from '@/lib/api/session'

const DashboardLayout = async ({ children }: PropsWithChildren) => {
  const sessionUser = await getSessionUser()
  if (!sessionUser) redirect('/login')

  const cookieStore = await cookies()
  const isSidebarCollapsed = cookieStore.get(SIDEBAR_COLLAPSED_COOKIE)?.value === 'true'

  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <div className="hidden md:contents">
        <Sidebar userEmail={sessionUser.email} defaultCollapsed={isSidebarCollapsed} />
      </div>
      <MobileNav userEmail={sessionUser.email} />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  )
}

export default DashboardLayout
