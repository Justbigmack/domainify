import { Suspense } from 'react'
import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { ApiKeysCard } from '@/app/(dashboard)/settings/_components/ApiKeysCard'
import type { ApiKeyListItem } from '@/app/(dashboard)/settings/_components/ApiKeysCard'
import { ApiKeysCardFallback } from '@/app/(dashboard)/settings/_components/ApiKeysCardFallback'
import { ExternalLink } from '@/components/brand/ExternalLink'
import { Heading } from '@/components/brand/Heading'
import { Text } from '@/components/brand/Text'
import { getSessionUser } from '@/lib/auth/server/session'
import { auth } from '@/lib/auth/server/auth'

export const metadata: Metadata = {
  title: 'API keys · Settings',
}

const ApiKeysList = async () => {
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

  return <ApiKeysCard items={items} />
}

const ApiKeysPage = () => (
  <>
    <header className="flex flex-col gap-1 pl-5">
      <div className="flex min-h-9 items-center">
        <Heading as="h1">API keys</Heading>
      </div>
      <Text className="max-w-prose leading-6 text-muted-foreground">
        Keys authenticate API requests via the Authorization header. A key grants full access to your
        domains. <ExternalLink href="/docs/api">Docs</ExternalLink>
      </Text>
    </header>
    <Suspense fallback={<ApiKeysCardFallback />}>
      <ApiKeysList />
    </Suspense>
  </>
)

export default ApiKeysPage
