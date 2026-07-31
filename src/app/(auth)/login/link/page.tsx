import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { BackToAppLink } from '@/components/auth/BackToAppLink'
import { MagicLinkCard } from '@/components/auth/MagicLinkCard'
import { getSessionUser } from '@/lib/api/session'

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
      {isAddingAccount ? <BackToAppLink /> : null}
    </>
  )
}

export default MagicLinkPage
