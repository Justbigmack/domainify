import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { BackToAppLink } from '@/components/brand/BackToAppLink'
import { LoginCard } from '@/app/(auth)/_components/LoginCard'
import { getSessionUser } from '@/lib/auth/session'

export const metadata: Metadata = {
  title: 'Log in',
}

type LoginPageProps = {
  searchParams: Promise<{ add?: string }>
}

const LoginPage = async ({ searchParams }: LoginPageProps) => {
  const { add } = await searchParams
  const sessionUser = await getSessionUser()
  const isSignedIn = sessionUser !== null
  const hasAddAccountParam = add !== undefined
  const isAddingAccount = isSignedIn && hasAddAccountParam
  if (isSignedIn && !isAddingAccount) redirect('/domains')

  return (
    <>
      <LoginCard isAddingAccount={isAddingAccount} />
      {isAddingAccount ? <BackToAppLink /> : null}
    </>
  )
}

export default LoginPage
