import { cache } from 'react'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'

export type SessionUser = {
  id: string
  email: string
}

export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return null
  return { id: session.user.id, email: session.user.email }
})
