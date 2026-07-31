import type { Metadata } from 'next'
import { ResetPasswordCard } from '@/components/auth/reset-password-card'

export const metadata: Metadata = {
  title: 'Reset password',
}

type ResetPasswordPageProps = {
  searchParams: Promise<{ token?: string; error?: string }>
}

const ResetPasswordPage = async ({ searchParams }: ResetPasswordPageProps) => {
  const { token, error } = await searchParams
  const hasToken = token !== undefined
  const hasResetError = error !== undefined
  const usableToken = hasToken && !hasResetError ? token : null

  return <ResetPasswordCard token={usableToken} />
}

export default ResetPasswordPage
