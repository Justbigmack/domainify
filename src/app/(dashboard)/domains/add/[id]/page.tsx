import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { DiagnosisCard } from '@/components/domains/diagnosis-card'
import { RecordCard } from '@/components/domains/record-card'
import { Stepper, StepperStep } from '@/components/domains/stepper'
import { VerifySteps } from '@/components/domains/verify-steps'
import { BreadcrumbLink } from '@/components/shell/breadcrumb-link'
import { getSessionUser } from '@/lib/api/session'
import { challengeRecordName } from '@/lib/dns/normalize'
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
  if (!sessionUser) redirect('/login')

  const data = await loadDomainPageData(sessionUser.id, id)
  if (!data) notFound()

  const { domain, record, diagnosis, recordStatus } = data
  const recordName = challengeRecordName(domain.challengeHost, domain.registrableDomain)
  const isVerified = domain.status === 'verified'

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-8 lg:px-10">
      <header className="flex flex-col gap-1 pr-5 pl-17">
        <div>
          <BreadcrumbLink href="/domains" label="Domains" />
        </div>
        <h1 className="font-heading text-xl font-semibold tracking-tight">Add domain</h1>
      </header>
      <Stepper>
        <StepperStep
          index={1}
          title="Domain"
          state="done"
          aside={
            <span className="min-w-0 truncate text-sm text-muted-foreground">
              {domain.hostname}
            </span>
          }
        />
        <StepperStep
          index={2}
          title="Verify ownership"
          state={isVerified ? 'done' : 'active'}
          isLast
        >
          <div className="flex flex-col gap-4">
            {isVerified ? (
              <>
                <p className="rounded-xl bg-success/10 px-5 py-3 text-sm font-medium text-success">
                  {domain.hostname} is verified. Ownership is proven.
                </p>
                <RecordCard recordValue={record.value} recordName={recordName} recordStatus={recordStatus} />
              </>
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
          </div>
        </StepperStep>
      </Stepper>
    </div>
  )
}

export default AddDomainRecordPage
