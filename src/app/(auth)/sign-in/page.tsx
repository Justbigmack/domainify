import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { SignInCard } from '@/components/auth/sign-in-card'
import { GlobeIcon } from '@/components/icons'
import { getSessionUser } from '@/lib/api/session'

export const metadata: Metadata = {
  title: 'Sign in',
}

const SignInPage = async () => {
  const sessionUser = await getSessionUser()
  if (sessionUser) redirect('/domains')

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 px-6 py-12">
      <div className="flex items-center gap-2.5">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-ink">
          <GlobeIcon className="size-4.5" />
        </div>
        <span className="text-base font-semibold tracking-tight">Domainify</span>
      </div>
      <SignInCard />
    </main>
  )
}

export default SignInPage
