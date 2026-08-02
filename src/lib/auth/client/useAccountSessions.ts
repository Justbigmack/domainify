'use client'

import { useState } from 'react'
import { loadAccountSessions } from '@/lib/auth/actions'
import type { AccountSession } from '@/lib/auth/server/session'

export const useAccountSessions = (userEmail?: string) => {
  const [loadedAccounts, setLoadedAccounts] = useState<AccountSession[] | null>(null)
  const [loadedForEmail, setLoadedForEmail] = useState(userEmail)
  const [isLoadingSessions, setIsLoadingSessions] = useState(false)

  const hasSignedInAccountChanged = userEmail !== loadedForEmail
  if (hasSignedInAccountChanged) {
    setLoadedForEmail(userEmail)
    setLoadedAccounts(null)
  }

  const hasInitialAccount = userEmail !== undefined
  const fallbackAccounts: AccountSession[] = hasInitialAccount
    ? [{ activeSessionToken: '', deviceSessionTokens: [], email: userEmail, isCurrent: true }]
    : []
  const hasLoadedAccounts = loadedAccounts !== null && !hasSignedInAccountChanged
  const accounts = hasLoadedAccounts ? loadedAccounts : fallbackAccounts

  const handleMenuOpen = () => {
    if (hasLoadedAccounts || isLoadingSessions) return
    setIsLoadingSessions(true)
    void loadAccountSessions()
      .then((sessions) => {
        if (sessions.length > 0) setLoadedAccounts(sessions)
      })
      .finally(() => setIsLoadingSessions(false))
  }

  const removeAccount = (email: string) => {
    setLoadedAccounts((currentAccounts) =>
      currentAccounts === null
        ? null
        : currentAccounts.filter((account) => account.email !== email),
    )
  }

  return { accounts, handleMenuOpen, removeAccount, isLoadingSessions }
}
