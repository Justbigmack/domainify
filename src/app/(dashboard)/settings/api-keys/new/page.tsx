import type { Metadata } from 'next'
import { KeyRoundIcon } from 'lucide-react'
import { CreateApiKeyForm } from '@/app/(dashboard)/settings/_components/CreateApiKeyForm'
import { BreadcrumbLink } from '@/components/brand/BreadcrumbLink'
import { Heading } from '@/components/brand/Heading'

export const metadata: Metadata = {
  title: 'Create API key · Settings',
}

const CreateApiKeyPage = () => (
  <>
    <header className="flex flex-col gap-1 pl-5">
      <div className="flex min-h-9 items-center">
        <BreadcrumbLink href="/settings/api-keys" label="API keys" icon={KeyRoundIcon} />
      </div>
      <Heading as="h1">Create API key</Heading>
    </header>
    <CreateApiKeyForm />
  </>
)

export default CreateApiKeyPage
