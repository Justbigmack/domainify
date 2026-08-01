import type { PropsWithChildren } from 'react'
import { SettingsMobileNav } from '@/app/settings/_components/SettingsMobileNav'
import { SettingsSidebar } from '@/app/settings/_components/SettingsSidebar'

const SettingsLayout = ({ children }: PropsWithChildren) => (
  <div className="flex min-h-dvh flex-col md:flex-row">
    <SettingsSidebar />
    <SettingsMobileNav />
    <main className="min-w-0 flex-1">{children}</main>
  </div>
)

export default SettingsLayout
