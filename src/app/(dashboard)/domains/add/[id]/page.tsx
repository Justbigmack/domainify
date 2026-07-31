import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { DiagnosisCard } from '@/app/(dashboard)/domains/_components/DiagnosisCard'
import { RecordCard } from '@/app/(dashboard)/domains/_components/RecordCard'
import {
  Stepper,
  StepperContent,
  StepperHeader,
  StepperStep,
  StepperTitle,
} from '@/app/(dashboard)/domains/_components/Stepper'
import { VerifySteps } from '@/app/(dashboard)/domains/_components/VerifySteps'
import { Heading } from '@/components/brand/Heading'
import { Text } from '@/components/brand/Text'
import { BreadcrumbLink } from '@/components/shell/BreadcrumbLink'
import { getSessionUser } from '@/lib/api/session'
import { challengeRecordName } from '@/lib/dns/normalize'
import { loadDomainPageData } from '@/lib/domains/pageData'

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
        <Heading as="h1">Add domain</Heading>
      </header>
      <Stepper>
        <StepperStep index={1} state="done">
          <StepperHeader>
            <StepperTitle>Domain</StepperTitle>
            <Text as="span" className="min-w-0 truncate text-muted-foreground">
              {domain.hostname}
            </Text>
          </StepperHeader>
        </StepperStep>
        <StepperStep index={2} state={isVerified ? 'done' : 'active'}>
          <StepperHeader>
            <StepperTitle>Verify ownership</StepperTitle>
          </StepperHeader>
          <StepperContent>
            <div className="flex flex-col gap-4">
              {isVerified ? (
                <>
                  <Text className="rounded-xl bg-success/10 px-5 py-3 font-medium text-success">
                    {domain.hostname} is verified. Ownership is proven.
                  </Text>
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
          </StepperContent>
        </StepperStep>
      </Stepper>
    </div>
  )
}

export default AddDomainRecordPage
