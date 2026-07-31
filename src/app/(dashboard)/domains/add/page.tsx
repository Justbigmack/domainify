import type { Metadata } from 'next'
import { AddDomainForm } from '@/components/domains/AddDomainForm'
import { Stepper, StepperStep } from '@/components/domains/Stepper'
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
      <h1 className="font-heading text-xl font-semibold tracking-tight">Add domain</h1>
      <p className="text-sm leading-6 text-muted-foreground">
        Prove you own a domain by placing one TXT record in its DNS.
      </p>
    </header>
    <Stepper>
      <StepperStep index={1} title="Domain" state="active">
        <AddDomainForm />
      </StepperStep>
      <StepperStep index={2} title="DNS record" state="upcoming" isLast>
        <p className="px-5 text-sm leading-6 text-muted-foreground">
          Add your domain first and we&apos;ll generate a unique TXT record for it.
        </p>
      </StepperStep>
    </Stepper>
  </div>
)

export default AddDomainPage
