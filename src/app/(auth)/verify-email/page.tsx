import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { VerifyEmailCard } from '@/app/(auth)/verify-email/_components/VerifyEmailCard'
import { emailFieldSchema } from '@/lib/auth/model/formSchemas'

export const metadata: Metadata = {
  title: 'Verify your email',
}

type VerifyEmailPageProps = {
  searchParams: Promise<{ email?: string; resent?: string }>
}

const VerifyEmailPage = async ({ searchParams }: VerifyEmailPageProps) => {
  const { email, resent } = await searchParams
  const parsedEmail = emailFieldSchema.safeParse(email)
  if (!parsedEmail.success) redirect('/login')

  return <VerifyEmailCard email={parsedEmail.data} hasResent={resent !== undefined} />
}

export default VerifyEmailPage
