import { BackToAppLink } from '@/components/brand/BackToAppLink'
import { Sidebar } from '@/components/brand/Sidebar'
import { DocsNavList } from './DocsNavList'

export const DocsSidebar = () => (
  <Sidebar className="overflow-y-auto">
    <div className="flex h-14 shrink-0 items-center px-6">
      <BackToAppLink />
    </div>
    <DocsNavList />
  </Sidebar>
)
