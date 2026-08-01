import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { CircleCheckIcon, TriangleAlertIcon } from 'lucide-react'
import { AlertBanner } from '@/components/brand/AlertBanner'
import { Text } from '@/components/brand/Text'
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
import { RecordCard } from '@/app/(dashboard)/domains/_components/RecordCard'
import { RestartButton } from '@/app/(dashboard)/domains/_components/RestartButton'
import { VerifySteps } from '@/app/(dashboard)/domains/_components/VerifySteps'
import { getSessionUser } from '@/lib/auth/session'
import { challengeRecordName } from '@/lib/dns/normalize'
import { loadDomainPageData } from '@/lib/domains/pageData'
import { getDomainForUser } from '@/lib/domains/service'
import type { DomainStatus } from '@/lib/domains/status'

const STATUS_TITLES: Record<DomainStatus, (hostname: string) => string> = {
  pending: (hostname) => `Verifying ${hostname}`,
  verified: (hostname) => `Domain verified · ${hostname}`,
  temporary_failure: (hostname) => `Record missing · ${hostname}`,
  failed: (hostname) => `Verification failed · ${hostname}`,
}

type DomainDetailPageProps = {
  params: Promise<{ id: string }>
}

export const generateMetadata = async ({ params }: DomainDetailPageProps): Promise<Metadata> => {
  const { id } = await params
  const sessionUser = await getSessionUser()
  if (!sessionUser) return { title: 'Domain' }
  try {
    const domain = await getDomainForUser(sessionUser.id, id)
    return { title: STATUS_TITLES[domain.status](domain.hostname) }
  } catch {
    return { title: 'Domain' }
  }
}

const DomainDetailPage = async ({ params }: DomainDetailPageProps) => {
  const { id } = await params
  const sessionUser = await getSessionUser()
  if (!sessionUser) redirect('/login')

  const data = await loadDomainPageData(sessionUser.id, id)
  if (!data) notFound()

  const { domain, record, diagnosis, recordStatus } = data
  const recordName = challengeRecordName(domain.challengeHost, domain.registrableDomain)
  const isFailed = domain.status === 'failed'
  const isVerified = domain.status === 'verified'
  const isSettled = isFailed || isVerified

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-8 lg:px-10">
      <DomainHeader domain={domain} />
      {isVerified && (
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
      {isFailed && (
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
      <Section>
        <SectionHeader>
          <SectionTitle>DNS records</SectionTitle>
          <SectionDescription>
            The records we use to verify ownership of this domain.
          </SectionDescription>
        </SectionHeader>
        {isSettled ? (
          <SectionContent>
            <RecordCard recordValue={record.value} recordName={recordName} recordStatus={recordStatus} />
          </SectionContent>
        ) : (
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
        )}
      </Section>
      <Section>
        <SectionHeader>
          <SectionTitle>Danger zone</SectionTitle>
          <SectionDescription>Irreversible actions for this domain.</SectionDescription>
        </SectionHeader>
        <DangerZone domainId={domain.id} hostname={domain.hostname} status={domain.status} />
      </Section>
    </div>
  )
}

export default DomainDetailPage
