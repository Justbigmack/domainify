'use client'

import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/authClient'

const ADD_ACCOUNT_PATH = '/login?add=1'

export const useAccountActions = () => {
  const router = useRouter()

  const handleSignOut = async () => {
    await authClient.signOut()
    router.push('/login')
    router.refresh()
  }

  const handleAddAccount = () => {
    router.push(ADD_ACCOUNT_PATH)
  }

  const handleAccountSwitch = async (sessionToken: string) => {
    const { error } = await authClient.multiSession.setActive({ sessionToken })
    if (error) {
      router.push(ADD_ACCOUNT_PATH)
      return
    }
    router.push('/domains')
    router.refresh()
  }

  return { handleSignOut, handleAddAccount, handleAccountSwitch }
}
