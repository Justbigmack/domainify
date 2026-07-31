import { DocsBackLink } from './docs-back-link'
import { DocsNavList } from './docs-nav-list'

export const DocsSidebar = () => (
  <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col overflow-y-auto border-r bg-sidebar text-sidebar-foreground md:flex">
    <div className="flex h-14 shrink-0 items-center px-6">
      <DocsBackLink />
    </div>
    <DocsNavList />
  </aside>
)
