import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { PlusIcon } from 'lucide-react'
import { ApiViewPanel } from '@/app/(dashboard)/domains/_components/ApiViewPanel'
import { DomainsTable } from '@/app/(dashboard)/domains/_components/DomainsTable'
import type { DomainListItem } from '@/app/(dashboard)/domains/_components/DomainsTable'
import { EmptyState } from '@/app/(dashboard)/domains/_components/EmptyState'
import { Heading } from '@/components/brand/Heading'
import { PageContainer } from '@/components/brand/PageContainer'
import { Button } from '@/components/ui/button'
import type { DomainRow } from '@/db/schema'
import { getSessionUser } from '@/lib/auth/session'
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
  if (!sessionUser) redirect('/login')

  const userDomains = await listDomains(sessionUser.id)
  const items = userDomains.map(toListItem)
  const firstItem = items[0] ?? null
  const apiTarget = firstItem ? { id: firstItem.id, hostname: firstItem.hostname } : null

  return (
    <PageContainer>
      <header className="flex items-center justify-between gap-4 pl-5">
        <Heading as="h1">Domains</Heading>
        <div className="flex items-center gap-2">
          <div className="max-md:hidden">
            <ApiViewPanel scope="collection" target={apiTarget} />
          </div>
          {items.length > 0 && (
            <Button nativeButton={false} className="pr-5" render={<Link href="/domains/add" />}>
              <PlusIcon data-icon="inline-start" />
              Add domain
            </Button>
          )}
        </div>
      </header>
      {items.length === 0 ? <EmptyState /> : <DomainsTable items={items} />}
    </PageContainer>
  )
}

export default DomainsPage
