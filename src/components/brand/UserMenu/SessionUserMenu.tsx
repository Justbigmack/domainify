import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth/session'
import { UserMenu } from './UserMenu'

export const SessionUserMenu = async () => {
  const sessionUser = await getSessionUser()
  if (!sessionUser) redirect('/login')

  return <UserMenu userEmail={sessionUser.email} />
}
