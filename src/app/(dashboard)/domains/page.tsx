import { Suspense } from 'react'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { PlusIcon } from 'lucide-react'
import { ApiViewPanel } from '@/app/(dashboard)/domains/_components/ApiViewPanel'
import { DomainsTable } from '@/app/(dashboard)/domains/_components/DomainsTable'
import type { DomainListItem } from '@/app/(dashboard)/domains/_components/DomainsTable'
import { DomainsTableFallback } from '@/app/(dashboard)/domains/_components/DomainsTableFallback'
import { EmptyState } from '@/app/(dashboard)/domains/_components/EmptyState'
import { Heading } from '@/components/brand/Heading'
import { PageContainer } from '@/components/brand/PageContainer'
import { PrimaryButton } from '@/components/brand/PrimaryButton'
import type { DomainRow } from '@/db/schema'
import { getSessionUser } from '@/lib/auth/session'
import { getCachedDomains } from '@/lib/domains/cache'

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

const DomainsList = async () => {
  const sessionUser = await getSessionUser()
  if (!sessionUser) redirect('/login')

  const userDomains = await getCachedDomains(sessionUser.id)
  if (userDomains.length === 0) return <EmptyState />
  return <DomainsTable items={userDomains.map(toListItem)} />
}

const DomainsPage = () => (
  <PageContainer>
    <header className="flex min-h-9 items-center justify-between gap-4 pl-5">
      <Heading as="h1">Domains</Heading>
      <div className="flex items-center gap-2">
        <div className="max-md:hidden">
          <ApiViewPanel scope="collection" />
        </div>
        <PrimaryButton icon={PlusIcon} href="/domains/add">
          Add domain
        </PrimaryButton>
      </div>
    </header>
    <Suspense fallback={<DomainsTableFallback />}>
      <DomainsList />
    </Suspense>
  </PageContainer>
)

export default DomainsPage
