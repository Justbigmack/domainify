'use client'

import { useState } from 'react'
import { loadAccountSessions } from '@/lib/api/account-actions'
import type { AccountSession } from '@/lib/api/session'

export const useAccountSessions = (userEmail: string) => {
  const [accounts, setAccounts] = useState<AccountSession[]>([
    { sessionToken: '', email: userEmail, isCurrent: true },
  ])
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
