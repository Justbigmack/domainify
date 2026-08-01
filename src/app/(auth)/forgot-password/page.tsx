import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { ForgotPasswordCard } from '@/app/(auth)/_components/ForgotPasswordCard'
import { getSessionUser } from '@/lib/api/session'

export const metadata: Metadata = {
  title: 'Forgot password',
}

const ForgotPasswordPage = async () => {
  const sessionUser = await getSessionUser()
  if (sessionUser) redirect('/domains')

  return <ForgotPasswordCard />
}

export default ForgotPasswordPage
