import type { Metadata } from 'next'
import Link from 'next/link'
import { AddDomainForm } from '@/components/domains/add-domain-form'
import { Stepper, StepperStep } from '@/components/domains/stepper'

export const metadata: Metadata = {
  title: 'Add domain',
}

const AddDomainPage = () => (
  <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-8 lg:px-10">
    <header className="flex flex-col gap-2">
      <Link
        href="/domains"
        className="self-start text-sm text-ink-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        ← Domains
      </Link>
      <h1 className="text-xl font-semibold tracking-tight">Add domain</h1>
      <p className="text-sm leading-6 text-ink-muted">
        Prove you own a domain by placing one TXT record in its DNS.
      </p>
    </header>
    <Stepper>
      <StepperStep index={1} title="Domain" state="active">
        <AddDomainForm />
      </StepperStep>
      <StepperStep index={2} title="DNS record" state="upcoming" isLast>
        <p className="text-sm leading-6 text-ink-muted">
          Add your domain first — we&apos;ll generate a unique TXT record for it.
        </p>
      </StepperStep>
    </Stepper>
  </div>
)

export default AddDomainPage
