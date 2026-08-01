'use client'

import { useState } from 'react'
import { loadAccountSessions } from '@/lib/account/sessionActions'
import type { AccountSession } from '@/lib/auth/session'

export const useAccountSessions = (userEmail?: string) => {
  const hasInitialAccount = userEmail !== undefined
  const initialAccounts: AccountSession[] = hasInitialAccount
    ? [{ sessionToken: '', email: userEmail, isCurrent: true }]
    : []
  const [accounts, setAccounts] = useState<AccountSession[]>(initialAccounts)
  const [hasRequested, setHasRequested] = useState(false)

  const handleMenuOpen = () => {
    if (hasRequested) return
    setHasRequested(true)
    void loadAccountSessions().then((sessions) => {
      if (sessions.length > 0) setAccounts(sessions)
    })
  }

  return { accounts, handleMenuOpen }
}
