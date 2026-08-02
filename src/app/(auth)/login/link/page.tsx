import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { BackToAppLink } from '@/components/brand/BackToAppLink'
import { MagicLinkCard } from '@/app/(auth)/login/link/_components/MagicLinkCard'
import { getSessionUser } from '@/lib/auth/server/session'

export const metadata: Metadata = {
  title: 'Sign in with email link',
}

type MagicLinkPageProps = {
  searchParams: Promise<{ add?: string }>
}

const MagicLinkPage = async ({ searchParams }: MagicLinkPageProps) => {
  const { add } = await searchParams
  const sessionUser = await getSessionUser()
  const isSignedIn = sessionUser !== null
  const hasAddAccountParam = add !== undefined
  const isAddingAccount = isSignedIn && hasAddAccountParam
  if (isSignedIn && !isAddingAccount) redirect('/domains')

  return (
    <>
      <MagicLinkCard isAddingAccount={isAddingAccount} />
      {isAddingAccount ? (
        <div className="mt-7 flex justify-center">
          <BackToAppLink />
        </div>
      ) : null}
    </>
  )
}

export default MagicLinkPage
