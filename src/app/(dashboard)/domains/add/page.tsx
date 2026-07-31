import type { Metadata } from 'next'
import { AddDomainForm } from '@/app/(dashboard)/domains/_components/AddDomainForm'
import {
  Stepper,
  StepperContent,
  StepperHeader,
  StepperStep,
  StepperTitle,
} from '@/app/(dashboard)/domains/_components/Stepper'
import { Heading } from '@/components/brand/Heading'
import { Text } from '@/components/brand/Text'
import { BreadcrumbLink } from '@/components/shell/BreadcrumbLink'

export const metadata: Metadata = {
  title: 'Add domain',
}

const AddDomainPage = () => (
  <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-8 lg:px-10">
    <header className="flex flex-col gap-1 pr-5 pl-17">
      <div>
        <BreadcrumbLink href="/domains" label="Domains" />
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
  </div>
)

export default AddDomainPage
