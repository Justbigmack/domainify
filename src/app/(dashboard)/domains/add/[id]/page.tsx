import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { DiagnosisCard } from '@/components/domains/diagnosis-card'
import { DigHint } from '@/components/domains/dig-hint'
import { ProviderCard } from '@/components/domains/provider-card'
import { RecordCard } from '@/components/domains/record-card'
import { SourcePills } from '@/components/domains/source-pills'
import { Stepper, StepperStep } from '@/components/domains/stepper'
import { VerifySection } from '@/components/domains/verify-section'
import { CheckIcon } from '@/components/icons'
import { buttonClassName } from '@/components/ui/button'
import { cn } from '@/lib/cn'
import { getSessionUser } from '@/lib/api/session'
import { loadDomainPageData } from '@/lib/domains/page-data'

export const metadata: Metadata = {
  title: 'Add domain',
}

type AddDomainRecordPageProps = {
  params: Promise<{ id: string }>
}

const AddDomainRecordPage = async ({ params }: AddDomainRecordPageProps) => {
  const { id } = await params
  const sessionUser = await getSessionUser()
  if (!sessionUser) redirect('/sign-in')

  const data = await loadDomainPageData(sessionUser.id, id)
  if (!data) notFound()

  const { domain, record, pills, diagnosis, recordStatus } = data
  const isVerified = domain.status === 'verified'
  const isSettled = isVerified || domain.status === 'failed'
  const detailLinkVariant = isVerified ? 'primary' : 'ghost'

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-8 lg:px-10">
      <header className="flex flex-col gap-2">
        <Link
          href="/domains"
          className="self-start text-sm text-ink-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          ← Domains
        </Link>
        <h1 className="text-xl font-semibold tracking-tight">Add domain</h1>
      </header>
      <Stepper>
        <StepperStep index={1} title="Domain" state="done">
          <div className="flex items-center gap-2 self-start rounded-xl border border-success/40 bg-success-soft px-4 py-2.5 text-sm">
            <CheckIcon className="size-4 shrink-0 text-success" />
            <span className="font-mono font-medium break-all">{domain.hostname}</span>
          </div>
        </StepperStep>
        <StepperStep index={2} title="DNS record" state={isVerified ? 'done' : 'active'} isLast>
          <div className="flex flex-col gap-4">
            {isVerified ? (
              <p className="rounded-xl bg-success-soft px-4 py-3 text-sm font-medium text-success">
                {domain.hostname} is verified — ownership is proven.
              </p>
            ) : (
              <p className="text-sm leading-6 text-ink-muted">
                Create this TXT record at your DNS provider, then leave this page open — we spot
                the record within seconds of it going live.
              </p>
            )}
            <RecordCard
              challengeHost={domain.challengeHost}
              recordValue={record.value}
              recordStatus={recordStatus}
            />
            {!isVerified && <ProviderCard providerId={domain.dnsProviderId} />}
            {!isVerified && <DigHint challengeHost={domain.challengeHost} />}
            <VerifySection domainId={domain.id} isSettled={isSettled}>
              <SourcePills pills={pills} />
              {diagnosis && <DiagnosisCard diagnosis={diagnosis} />}
            </VerifySection>
            <Link
              href={`/domains/${domain.id}`}
              className={cn(buttonClassName(detailLinkVariant), 'self-start')}
            >
              Go to domain page
            </Link>
          </div>
        </StepperStep>
      </Stepper>
    </div>
  )
}

export default AddDomainRecordPage
