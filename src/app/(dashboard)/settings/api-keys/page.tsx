import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { ApiKeysCard } from '@/app/(dashboard)/settings/_components/ApiKeysCard'
import type { ApiKeyListItem } from '@/app/(dashboard)/settings/_components/ApiKeysCard'
import { Heading } from '@/components/brand/Heading'
import { getSessionUser } from '@/lib/auth/session'
import { auth } from '@/lib/auth/server'

export const metadata: Metadata = {
  title: 'API keys · Settings',
}

const ApiKeysPage = async () => {
  const sessionUser = await getSessionUser()
  if (!sessionUser) redirect('/login')

  const { apiKeys } = await auth.api.listApiKeys({ headers: await headers() })
  const items: ApiKeyListItem[] = [...apiKeys]
    .sort((first, second) => second.createdAt.getTime() - first.createdAt.getTime())
    .map((key) => ({
      id: key.id,
      name: key.name ?? 'Untitled key',
      start: key.start ?? null,
      createdAt: key.createdAt.toISOString(),
      lastRequest: key.lastRequest ? key.lastRequest.toISOString() : null,
    }))

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-8 lg:px-10">
      <header className="pl-5">
        <Heading as="h1">API keys</Heading>
      </header>
      <ApiKeysCard items={items} />
    </div>
  )
}

export default ApiKeysPage
