import type { PropsWithChildren } from 'react'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/shell/sidebar'
import { getSessionUser } from '@/lib/api/session'

const DashboardLayout = async ({ children }: PropsWithChildren) => {
  const sessionUser = await getSessionUser()
  if (!sessionUser) redirect('/sign-in')

  return (
    <div className="flex min-h-dvh">
      <Sidebar userEmail={sessionUser.email} />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  )
}

export default DashboardLayout
