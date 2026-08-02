import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { BackToAppLink } from '@/components/brand/BackToAppLink'
import { SignUpCard } from '@/app/(auth)/_components/SignUpCard'
import { getSessionUser } from '@/lib/auth/session'

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
      {isAddingAccount ? (
        <div className="mt-7 flex justify-center">
          <BackToAppLink />
        </div>
      ) : null}
    </>
  )
}

export default SignUpPage
