import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ApiViewPanel } from '@/components/api/api-view-panel'
import { CheckTimeline } from '@/components/domains/check-timeline'
import { DangerZone } from '@/components/domains/danger-zone'
import { DiagnosisCard } from '@/components/domains/diagnosis-card'
import { DigHint } from '@/components/domains/dig-hint'
import { DomainEvents } from '@/components/domains/domain-events'
import { MetaRow } from '@/components/domains/meta-row'
import { ProviderCard } from '@/components/domains/provider-card'
import { RecordCard } from '@/components/domains/record-card'
import { RestartButton } from '@/components/domains/restart-button'
import { SourcePills } from '@/components/domains/source-pills'
import { VerifySection } from '@/components/domains/verify-section'
import { GlobeIcon } from '@/components/icons'
import { getSessionUser } from '@/lib/api/session'
import { deriveDomainEvents } from '@/lib/domains/insights'
import { loadDomainPageData } from '@/lib/domains/page-data'
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
  if (!sessionUser) redirect('/sign-in')

  const data = await loadDomainPageData(sessionUser.id, id)
  if (!data) notFound()

  const { domain, checks, record, pills, diagnosis, recordStatus } = data
  const events = deriveDomainEvents(domain, checks, record.value)
  const isFailed = domain.status === 'failed'
  const isVerified = domain.status === 'verified'

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-8 lg:px-10">
      <header className="flex flex-col gap-5">
        <Link
          href="/domains"
          className="self-start text-sm text-ink-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          ← Domains
        </Link>
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-ink-muted">
              <GlobeIcon className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium tracking-wide text-ink-subtle uppercase">Domain</p>
              <h1 className="font-mono text-xl font-semibold tracking-tight break-all">
                {domain.hostname}
              </h1>
            </div>
          </div>
          <ApiViewPanel scope="domain" target={{ id: domain.id, hostname: domain.hostname }} />
        </div>
        <MetaRow domain={domain} />
      </header>
      <DomainEvents status={domain.status} events={events} />
      {isFailed && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-danger/40 bg-danger-soft px-4 py-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-danger">
              We couldn&apos;t find the record within the 72-hour window.
            </p>
            <p className="mt-1 text-sm leading-6 text-ink-muted">
              Restarting mints a fresh token and opens a new 72-hour window.
            </p>
          </div>
          <RestartButton domainId={domain.id} />
        </div>
      )}
      <RecordCard
        challengeHost={domain.challengeHost}
        recordValue={record.value}
        recordStatus={recordStatus}
      />
      {!isVerified && !isFailed && <ProviderCard providerId={domain.dnsProviderId} />}
      {!isVerified && !isFailed && <DigHint challengeHost={domain.challengeHost} />}
      {!isFailed && (
        <VerifySection domainId={domain.id} isSettled={isVerified}>
          <SourcePills pills={pills} />
          {diagnosis && <DiagnosisCard diagnosis={diagnosis} />}
        </VerifySection>
      )}
      <CheckTimeline checks={checks} />
      <DangerZone domainId={domain.id} hostname={domain.hostname} status={domain.status} />
    </div>
  )
}

export default DomainDetailPage
