import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { TriangleAlertIcon } from 'lucide-react'
import { Settings } from '@/components/brand/Settings'
import { Text } from '@/components/brand/Text'
import { DangerZone } from '@/app/(dashboard)/domains/_components/DangerZone'
import { DiagnosisCard } from '@/app/(dashboard)/domains/_components/DiagnosisCard'
import { DomainEvents } from '@/app/(dashboard)/domains/_components/DomainEvents'
import { DomainHeader } from '@/app/(dashboard)/domains/_components/DomainHeader'
import { RecordCard } from '@/app/(dashboard)/domains/_components/RecordCard'
import { RestartButton } from '@/app/(dashboard)/domains/_components/RestartButton'
import { VerifySteps } from '@/app/(dashboard)/domains/_components/VerifySteps'
import { getSessionUser } from '@/lib/api/session'
import { challengeRecordName } from '@/lib/dns/normalize'
import { deriveDomainEvents } from '@/lib/domains/insights'
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

  const { domain, checks, record, diagnosis, recordStatus } = data
  const recordName = challengeRecordName(domain.challengeHost, domain.registrableDomain)
  const events = deriveDomainEvents(domain, checks, record.value)
  const isFailed = domain.status === 'failed'
  const isVerified = domain.status === 'verified'
  const isSettled = isFailed || isVerified

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-8 lg:px-10">
      <DomainHeader domain={domain} />
      <DomainEvents status={domain.status} events={events} />
      {isFailed && (
        <Settings.Alert
          tone="destructive"
          icon={TriangleAlertIcon}
          action={<RestartButton domainId={domain.id} />}
        >
          <Text className="font-medium text-inherit">
            We couldn&apos;t find the record within the 72-hour window.
          </Text>
          <Text className="text-destructive/80">
            Restarting mints a fresh token and opens a new 72-hour window.
          </Text>
        </Settings.Alert>
      )}
      <Settings.Root>
        <Settings.Header>
          <Settings.Title>DNS record</Settings.Title>
          <Settings.Description>
            The TXT record we use to prove ownership of this domain.
          </Settings.Description>
        </Settings.Header>
        {isSettled ? (
          <Settings.Content>
            <RecordCard recordValue={record.value} recordName={recordName} recordStatus={recordStatus} />
          </Settings.Content>
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
      </Settings.Root>
      <Settings.Root>
        <Settings.Header>
          <Settings.Title>Danger zone</Settings.Title>
          <Settings.Description>Irreversible actions for this domain.</Settings.Description>
        </Settings.Header>
        <DangerZone domainId={domain.id} hostname={domain.hostname} status={domain.status} />
      </Settings.Root>
    </div>
  )
}

export default DomainDetailPage
