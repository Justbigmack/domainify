import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { VerifyEmailCard } from '@/app/(auth)/verify-email/_components/VerifyEmailCard'

export const metadata: Metadata = {
  title: 'Verify your email',
}

type VerifyEmailPageProps = {
  searchParams: Promise<{ email?: string; resent?: string }>
}

const VerifyEmailPage = async ({ searchParams }: VerifyEmailPageProps) => {
  const { email, resent } = await searchParams
  if (email === undefined) redirect('/login')

  return <VerifyEmailCard email={email} hasResent={resent !== undefined} />
}

export default VerifyEmailPage
