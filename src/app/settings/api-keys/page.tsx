import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { ApiKeysCard } from '@/components/settings/api-keys-card'
import type { ApiKeyListItem } from '@/components/settings/api-keys-card'
import { auth } from '@/lib/auth'

export const metadata: Metadata = {
  title: 'API keys · Settings',
}

const ApiKeysPage = async () => {
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
        <h1 className="font-heading text-xl font-semibold tracking-tight">API keys</h1>
      </header>
      <ApiKeysCard items={items} />
    </div>
  )
}

export default ApiKeysPage
