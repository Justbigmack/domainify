import { cache } from 'react'
import { headers } from 'next/headers'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { user } from '@/db/authSchema'
import { auth } from '@/lib/auth/server'
import { API_KEY_PREFIX } from '@/lib/auth/policy'

export type SessionUser = {
  id: string
  email: string
}

const BEARER_SCHEME = 'Bearer '

const getApiKeyUser = async (requestHeaders: Headers): Promise<SessionUser | null> => {
  const authorization = requestHeaders.get('authorization')
  if (!authorization?.startsWith(BEARER_SCHEME)) return null
  const candidateKey = authorization.slice(BEARER_SCHEME.length).trim()
  if (!candidateKey.startsWith(API_KEY_PREFIX)) return null
  const verification = await auth.api.verifyApiKey({ body: { key: candidateKey } })
  if (!verification.valid || !verification.key) return null
  const [keyOwner] = await db
    .select({ id: user.id, email: user.email })
    .from(user)
    .where(eq(user.id, verification.key.referenceId))
    .limit(1)
  return keyOwner ?? null
}

export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return null
  return { id: session.user.id, email: session.user.email }
})

export const getApiRequestUser = cache(async (): Promise<SessionUser | null> => {
  const apiKeyUser = await getApiKeyUser(await headers())
  if (apiKeyUser) return apiKeyUser
  return getSessionUser()
})

export type AccountSession = {
  sessionToken: string
  email: string
  isCurrent: boolean
}

export const listAccountSessions = cache(async (): Promise<AccountSession[]> => {
  const sessionUser = await getSessionUser()
  if (!sessionUser) return []

  const deviceSessions = await auth.api.listDeviceSessions({ headers: await headers() })
  const orderedSessions = [...deviceSessions].sort(
    (first, second) => first.session.createdAt.getTime() - second.session.createdAt.getTime(),
  )

  const accountsByUserId = new Map<string, AccountSession>()
  for (const { session, user } of orderedSessions) {
    const existingAccount = accountsByUserId.get(user.id)
    if (existingAccount) {
      existingAccount.sessionToken = session.token
      continue
    }
    accountsByUserId.set(user.id, {
      sessionToken: session.token,
      email: user.email,
      isCurrent: user.id === sessionUser.id,
    })
  }
  return [...accountsByUserId.values()]
})
