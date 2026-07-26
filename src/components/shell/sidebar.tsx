import { ExternalLinkIcon, GlobeIcon } from '@/components/icons'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import { NavLink } from './nav-link'
import { SignOutButton } from './sign-out-button'

const README_URL = 'https://github.com/Justbigmack/domainify#readme'

type SidebarProps = {
  userEmail: string
}

export const Sidebar = ({ userEmail }: SidebarProps) => (
  <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-surface">
    <div className="flex h-16 items-center gap-2.5 px-5">
      <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-ink">
        <GlobeIcon className="size-4" />
      </div>
      <span className="text-sm font-semibold tracking-tight">Domainify</span>
    </div>
    <nav aria-label="Main" className="flex flex-1 flex-col gap-1 px-3 pt-2">
      <NavLink href="/domains">
        <GlobeIcon className="size-4" />
        Domains
      </NavLink>
      <a
        href={README_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-10 items-center gap-2.5 rounded-lg px-3 text-sm font-medium text-ink-muted transition-colors hover:bg-surface-muted/60 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        <ExternalLinkIcon className="size-4" />
        Docs
      </a>
    </nav>
    <div className="flex items-center gap-2 border-t border-border px-4 py-3">
      <span className="min-w-0 flex-1 truncate text-xs text-ink-muted" title={userEmail}>
        {userEmail}
      </span>
      <ThemeToggle />
      <SignOutButton />
    </div>
  </aside>
)
