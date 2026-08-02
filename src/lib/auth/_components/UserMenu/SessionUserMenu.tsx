import { getSessionUser } from '@/lib/auth/server/session'
import { UserMenu } from './UserMenu'

export const SessionUserMenu = async () => {
  const sessionUser = await getSessionUser()
  if (!sessionUser) return null

  return <UserMenu userEmail={sessionUser.email} />
}
