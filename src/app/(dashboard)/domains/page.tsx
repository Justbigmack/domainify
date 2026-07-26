import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ApiViewPanel } from '@/components/api/api-view-panel'
import { DomainsTable } from '@/components/domains/domains-table'
import type { DomainListItem } from '@/components/domains/domains-table'
import { EmptyState } from '@/components/domains/empty-state'
import { PlusIcon } from '@/components/icons'
import { buttonClassName } from '@/components/ui/button'
import type { DomainRow } from '@/db/schema'
import { getSessionUser } from '@/lib/api/session'
import { listDomains } from '@/lib/domains/service'

export const metadata: Metadata = {
  title: 'Domains',
}

const toListItem = (domain: DomainRow): DomainListItem => ({
  id: domain.id,
  hostname: domain.hostname,
  status: domain.status,
  createdAt: domain.createdAt.toISOString(),
  lastCheckedAt: domain.lastCheckedAt?.toISOString() ?? null,
  graceExpiresAt: domain.graceExpiresAt?.toISOString() ?? null,
})

const DomainsPage = async () => {
  const sessionUser = await getSessionUser()
  if (!sessionUser) redirect('/sign-in')

  const userDomains = await listDomains(sessionUser.id)
  const items = userDomains.map(toListItem)
  const firstItem = items[0] ?? null
  const apiTarget = firstItem ? { id: firstItem.id, hostname: firstItem.hostname } : null

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-8 lg:px-10">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold tracking-tight">Domains</h1>
        <div className="flex items-center gap-2">
          <ApiViewPanel scope="collection" target={apiTarget} />
          {items.length > 0 && (
            <Link href="/domains/add" className={buttonClassName('primary')}>
              <PlusIcon className="size-4" />
              Add domain
            </Link>
          )}
        </div>
      </header>
      {items.length === 0 ? <EmptyState /> : <DomainsTable items={items} />}
    </div>
  )
}

export default DomainsPage
