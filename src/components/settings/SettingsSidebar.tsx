import Link from 'next/link'
import { ChevronLeftIcon, KeyRoundIcon, SettingsIcon } from 'lucide-react'
import { NavLink } from '@/components/shell/NavLink'

const BACK_LINK_CLASS =
  '-ml-2.5 inline-flex h-8 w-fit items-center gap-1 rounded-[min(var(--radius-md),10px)] px-2.5 text-[0.8125rem] font-normal text-muted-foreground transition-colors outline-none hover:bg-sidebar-accent/60 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50'

export const SettingsBackLink = () => (
  <Link href="/domains" className={BACK_LINK_CLASS}>
    <ChevronLeftIcon aria-hidden strokeWidth={1.5} className="size-3.5 shrink-0" />
    Back to app
  </Link>
)

export const SettingsSidebar = () => (
  <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground md:flex">
    <div className="flex h-14 shrink-0 items-center px-6">
      <SettingsBackLink />
    </div>
    <nav aria-label="Settings" className="flex flex-1 flex-col gap-1 px-3 pt-1">
      <NavLink href="/settings/general" label="General" isCollapsed={false}>
        <SettingsIcon />
      </NavLink>
      <NavLink href="/settings/api-keys" label="API keys" isCollapsed={false}>
        <KeyRoundIcon />
      </NavLink>
    </nav>
  </aside>
)
