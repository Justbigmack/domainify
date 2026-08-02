import type { Metadata } from 'next'
import { GlobeIcon } from 'lucide-react'
import { AddDomainForm } from '@/app/(dashboard)/domains/add/_components/AddDomainForm'
import {
  Stepper,
  StepperContent,
  StepperHeader,
  StepperStep,
  StepperTitle,
} from '@/app/(dashboard)/domains/add/_components/Stepper'
import { Heading } from '@/components/brand/Heading'
import { PageContainer } from '@/components/brand/PageContainer'
import { Text } from '@/components/brand/Text'
import { BreadcrumbLink } from '@/components/brand/BreadcrumbLink'

export const metadata: Metadata = {
  title: 'Add domain',
}

const AddDomainPage = () => (
  <PageContainer>
    <header className="flex flex-col gap-1 pr-5 pl-17">
      <div className="flex min-h-9 items-center">
        <BreadcrumbLink href="/domains" label="Domains" icon={GlobeIcon} />
      </div>
      <Heading as="h1">Add domain</Heading>
      <Text className="leading-6 text-muted-foreground">
        Prove you own a domain by placing one TXT record in its DNS.
      </Text>
    </header>
    <Stepper>
      <StepperStep index={1} state="active">
        <StepperHeader>
          <StepperTitle>Domain</StepperTitle>
        </StepperHeader>
        <StepperContent>
          <AddDomainForm />
        </StepperContent>
      </StepperStep>
      <StepperStep index={2} state="upcoming">
        <StepperHeader>
          <StepperTitle>DNS record</StepperTitle>
        </StepperHeader>
        <StepperContent>
          <Text className="px-5 leading-6 text-muted-foreground">
            Add your domain first and we&apos;ll generate a unique TXT record for it.
          </Text>
        </StepperContent>
      </StepperStep>
    </Stepper>
  </PageContainer>
)

export default AddDomainPage
