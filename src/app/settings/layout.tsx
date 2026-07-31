import type { PropsWithChildren } from 'react'
import { redirect } from 'next/navigation'
import { SettingsBackLink, SettingsSidebar } from '@/components/settings/settings-sidebar'
import { getSessionUser } from '@/lib/api/session'

const SettingsLayout = async ({ children }: PropsWithChildren) => {
  const sessionUser = await getSessionUser()
  if (!sessionUser) redirect('/login')

  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <SettingsSidebar />
      <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center border-b bg-background/90 px-6 backdrop-blur md:hidden">
        <SettingsBackLink />
      </header>
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  )
}

export default SettingsLayout
