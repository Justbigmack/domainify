'use client'

import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth/client/authClient'

const ADD_ACCOUNT_PATH = '/login?add=1'
const LOGIN_PATH = '/login'
const DOMAINS_PATH = '/domains'

export const useAccountActions = () => {
  const router = useRouter()

  const handleSignOut = async () => {
    await authClient.signOut()
    window.location.href = LOGIN_PATH
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
    window.location.href = DOMAINS_PATH
  }

  return { handleSignOut, handleAddAccount, handleAccountSwitch }
}
