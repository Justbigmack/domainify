import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { BackToAppLink } from '@/components/auth/BackToAppLink'
import { SignUpCard } from '@/components/auth/SignUpCard'
import { getSessionUser } from '@/lib/api/session'

export const metadata: Metadata = {
  title: 'Create account',
}

type SignUpPageProps = {
  searchParams: Promise<{ add?: string }>
}

const SignUpPage = async ({ searchParams }: SignUpPageProps) => {
  const { add } = await searchParams
  const sessionUser = await getSessionUser()
  const isSignedIn = sessionUser !== null
  const hasAddAccountParam = add !== undefined
  const isAddingAccount = isSignedIn && hasAddAccountParam

  if (isSignedIn && !isAddingAccount) redirect('/domains')

  return (
    <>
      <SignUpCard isAddingAccount={isAddingAccount} />
      {isAddingAccount ? <BackToAppLink /> : null}
    </>
  )
}

export default SignUpPage
