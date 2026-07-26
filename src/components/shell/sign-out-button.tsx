'use client'

import { useRouter } from 'next/navigation'
import { SignOutIcon } from '@/components/icons'
import { authClient } from '@/lib/auth-client'

export const SignOutButton = () => {
  const router = useRouter()

  const handleSignOut = async () => {
    await authClient.signOut()
    router.push('/sign-in')
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      aria-label="Sign out"
      className="flex size-9 shrink-0 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
    >
      <SignOutIcon className="size-4" />
    </button>
  )
}
