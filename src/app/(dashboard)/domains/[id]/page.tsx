import { Suspense, cache } from 'react'
import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { CircleCheckIcon, TriangleAlertIcon } from 'lucide-react'
import { AlertBanner } from '@/components/brand/AlertBanner'
import { PageContainer } from '@/components/brand/PageContainer'
import { Text } from '@/components/brand/Text'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Section,
  SectionContent,
  SectionDescription,
  SectionHeader,
  SectionTitle,
} from '@/components/brand/Section'
import { DangerZone } from '@/app/(dashboard)/domains/_components/DangerZone'
import { DiagnosisCard } from '@/app/(dashboard)/domains/_components/DiagnosisCard'
import { DomainHeader } from '@/app/(dashboard)/domains/_components/DomainHeader'
import { DomainHeaderSkeleton } from '@/app/(dashboard)/domains/_components/DomainHeaderSkeleton'
import { RecordCard } from '@/app/(dashboard)/domains/_components/RecordCard'
import { RestartButton } from '@/app/(dashboard)/domains/_components/RestartButton'
import { VerifySteps } from '@/app/(dashboard)/domains/_components/VerifySteps'
import { getSessionUser } from '@/lib/auth/server/session'
import { challengeRecordName } from '@/lib/dns/normalize'
import { loadDomainPageData } from '@/lib/domains/server/pageData'

export const metadata: Metadata = {
  title: 'Domain',
}

type DomainParams = Promise<{ id: string }>

type DomainDetailPageProps = {
  params: DomainParams
}

const loadPageData = cache(async (domainId: string) => {
  const sessionUser = await getSessionUser()
  if (!sessionUser) redirect('/login')
  const data = await loadDomainPageData(sessionUser.id, domainId)
  if (!data) notFound()
  return data
})

const loadHostname = async (params: DomainParams): Promise<string | null> => {
  try {
    const { id } = await params
    const { domain } = await loadPageData(id)
    return domain.hostname
  } catch {
    return null
  }
}

const DomainIdentity = async ({ params }: DomainDetailPageProps) => {
  const { id } = await params
  const { domain } = await loadPageData(id)

  return (
    <>
      <DomainHeader domain={domain} />
      {domain.status === 'verified' && (
        <AlertBanner tone="success" icon={CircleCheckIcon}>
          <Text className="font-medium text-inherit">
            Your domain is verified. It’s ready to use.
          </Text>
        </AlertBanner>
      )}
      {domain.status === 'temporary_failure' && (
        <AlertBanner tone="destructive" icon={TriangleAlertIcon}>
          <Text className="font-medium text-inherit">
            We can&apos;t find verification DNS records. Add the records below back to stay verified.
          </Text>
        </AlertBanner>
      )}
      {domain.status === 'failed' && (
        <AlertBanner
          tone="destructive"
          icon={TriangleAlertIcon}
          action={<RestartButton domainId={domain.id} />}
        >
          <Text className="font-medium text-inherit">
            We couldn&apos;t find the record within the 72-hour window.
          </Text>
          <Text className="text-destructive/80">
            You need to generate a new token and start the verification process again.
          </Text>
        </AlertBanner>
      )}
    </>
  )
}

const DomainRecords = async ({ params }: DomainDetailPageProps) => {
  const { id } = await params
  const { domain, record, diagnosis, recordStatus } = await loadPageData(id)
  const recordName = challengeRecordName(domain.challengeHost, domain.registrableDomain)
  const isSettled = domain.status === 'failed' || domain.status === 'verified'

  if (isSettled) {
    return (
      <SectionContent>
        <RecordCard recordValue={record.value} recordName={recordName} recordStatus={recordStatus} />
      </SectionContent>
    )
  }

  return (
    <>
      <VerifySteps
        domainId={domain.id}
        recordValue={record.value}
        recordName={recordName}
        challengeHost={domain.challengeHost}
        detectedProviderId={domain.dnsProviderId}
      />
      {diagnosis && <DiagnosisCard diagnosis={diagnosis} />}
    </>
  )
}

const DomainRecordsSkeleton = () => (
  <div className="flex flex-col gap-4 rounded-xl border border-border/50 bg-card p-5">
    <Skeleton className="h-3.5 w-44" />
    <Skeleton className="h-10 rounded-lg" />
    <Skeleton className="h-3.5 w-64" />
    <Skeleton className="h-10 rounded-lg" />
  </div>
)

const DomainDangerZone = async ({
  params,
  hostname,
}: DomainDetailPageProps & { hostname: Promise<string | null> }) => {
  const { id } = await params
  return <DangerZone domainId={id} hostname={hostname} />
}

const DomainDetailPage = ({ params }: DomainDetailPageProps) => {
  const hostname = loadHostname(params)

  return (
    <PageContainer gap="lg">
      <Suspense fallback={<DomainHeaderSkeleton />}>
        <DomainIdentity params={params} />
      </Suspense>
      <Section>
        <SectionHeader>
          <SectionTitle>DNS records</SectionTitle>
          <SectionDescription>
            The records we use to verify ownership of this domain.
          </SectionDescription>
        </SectionHeader>
        <Suspense fallback={<DomainRecordsSkeleton />}>
          <DomainRecords params={params} />
        </Suspense>
      </Section>
      <Section>
        <SectionHeader>
          <SectionTitle>Danger zone</SectionTitle>
          <SectionDescription>Irreversible actions for this domain.</SectionDescription>
        </SectionHeader>
        <Suspense fallback={<DangerZone hostname={hostname} />}>
          <DomainDangerZone params={params} hostname={hostname} />
        </Suspense>
      </Section>
    </PageContainer>
  )
}

export default DomainDetailPage
