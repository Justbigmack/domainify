import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { KeyRoundIcon } from 'lucide-react'
import { CreateApiKeyForm } from '@/app/(dashboard)/settings/_components/CreateApiKeyForm'
import { BreadcrumbLink } from '@/components/brand/BreadcrumbLink'
import { Heading } from '@/components/brand/Heading'
import { getSessionUser } from '@/lib/auth/session'

export const metadata: Metadata = {
  title: 'Create API key · Settings',
}

const CreateApiKeyPage = async () => {
  const sessionUser = await getSessionUser()
  if (!sessionUser) redirect('/login')

  return (
    <>
      <header className="flex flex-col gap-1 pl-5">
        <div>
          <BreadcrumbLink href="/settings/api-keys" label="API keys" icon={KeyRoundIcon} />
        </div>
        <Heading as="h1">Create API key</Heading>
      </header>
      <CreateApiKeyForm />
    </>
  )
}

export default CreateApiKeyPage
