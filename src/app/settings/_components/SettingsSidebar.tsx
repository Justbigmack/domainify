import { KeyRoundIcon, SettingsIcon } from 'lucide-react'
import { BackToAppLink } from '@/components/brand/BackToAppLink'
import { NavLink, Sidebar, SidebarNav } from '@/components/brand/Sidebar'

export const SettingsSidebar = () => (
  <Sidebar>
    <div className="flex h-14 shrink-0 items-center px-6">
      <BackToAppLink />
    </div>
    <SidebarNav label="Settings" className="pt-1">
      <NavLink href="/settings/general" label="General">
        <SettingsIcon />
      </NavLink>
      <NavLink href="/settings/api-keys" label="API keys">
        <KeyRoundIcon />
      </NavLink>
    </SidebarNav>
  </Sidebar>
)
