import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { BackToAppLink } from '@/components/brand/BackToAppLink'
import { LoginCard } from '@/app/(auth)/login/_components/LoginCard'
import { resolveVerificationNotice } from '@/lib/auth/model/verificationNotice'
import { getSessionUser } from '@/lib/auth/server/session'

export const metadata: Metadata = {
  title: 'Log in',
}

type LoginPageProps = {
  searchParams: Promise<{ add?: string; verified?: string; error?: string }>
}

const LoginPage = async ({ searchParams }: LoginPageProps) => {
  const { add, verified, error } = await searchParams
  const sessionUser = await getSessionUser()
  const isSignedIn = sessionUser !== null
  const hasAddAccountParam = add !== undefined
  const isAddingAccount = isSignedIn && hasAddAccountParam
  if (isSignedIn && !isAddingAccount) redirect('/domains')

  const verificationNotice = resolveVerificationNotice({ verified, error })

  return (
    <>
      <LoginCard isAddingAccount={isAddingAccount} verificationNotice={verificationNotice} />
      {isAddingAccount ? (
        <div className="mt-7 flex justify-center">
          <BackToAppLink />
        </div>
      ) : null}
    </>
  )
}

export default LoginPage
