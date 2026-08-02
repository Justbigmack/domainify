import { Suspense } from 'react'
import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { GlobeIcon } from 'lucide-react'
import { DiagnosisCard } from '@/lib/domains/_components/DiagnosisCard'
import { RecordCard } from '@/lib/domains/_components/RecordCard'
import {
  Stepper,
  StepperContent,
  StepperHeader,
  StepperStep,
  StepperTitle,
} from '@/app/(dashboard)/domains/add/_components/Stepper'
import { VerifySteps } from '@/lib/domains/_components/VerifySteps'
import { Heading } from '@/components/brand/Heading'
import { PageContainer } from '@/components/brand/PageContainer'
import { Text } from '@/components/brand/Text'
import { BreadcrumbLink } from '@/components/brand/BreadcrumbLink'
import { Skeleton } from '@/components/ui/skeleton'
import { getSessionUser } from '@/lib/auth/server/session'
import { challengeRecordName } from '@/lib/dns/normalize'
import { loadDomainPageData } from '@/lib/domains/server/pageData'

export const metadata: Metadata = {
  title: 'Add domain',
}

type AddDomainRecordPageProps = {
  params: Promise<{ id: string }>
}

const AddDomainRecordSteps = async ({ params }: AddDomainRecordPageProps) => {
  const { id } = await params
  const sessionUser = await getSessionUser()
  if (!sessionUser) redirect('/login')

  const data = await loadDomainPageData(sessionUser.id, id)
  if (!data) notFound()

  const { domain, record, diagnosis, recordStatus } = data
  const recordName = challengeRecordName(domain.challengeHost, domain.registrableDomain)
  const isVerified = domain.status === 'verified'

  return (
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
                  <Text className="rounded-xl bg-success-subtle px-5 py-3 font-medium text-success">
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
                    registrableDomain={domain.registrableDomain}
                    detectedProviderId={domain.dnsProviderId}
                  />
                  {diagnosis && <DiagnosisCard diagnosis={diagnosis} />}
                </>
              )}
            </div>
          </StepperContent>
        </StepperStep>
      </Stepper>
  )
}

const AddDomainRecordPage = ({ params }: AddDomainRecordPageProps) => (
  <PageContainer>
    <header className="flex flex-col gap-1 pr-5 pl-17">
      <div className="flex min-h-9 items-center">
        <BreadcrumbLink href="/domains" label="Domains" icon={GlobeIcon} />
      </div>
      <Heading as="h1">Add domain</Heading>
    </header>
    <Suspense fallback={<Skeleton aria-busy className="h-64 rounded-xl" />}>
      <AddDomainRecordSteps params={params} />
    </Suspense>
  </PageContainer>
)

export default AddDomainRecordPage
