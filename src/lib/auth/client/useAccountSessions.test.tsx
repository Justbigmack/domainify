import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AccountSession } from '@/lib/auth/server/session'
import { useAccountSessions } from '@/lib/auth/client/useAccountSessions'

const { loadAccountSessionsMock } = vi.hoisted(() => ({
  loadAccountSessionsMock: vi.fn<() => Promise<AccountSession[]>>(),
}))

vi.mock('@/lib/auth/actions', () => ({
  loadAccountSessions: loadAccountSessionsMock,
}))

const accountSession = (email: string, isCurrent: boolean): AccountSession => ({
  activeSessionToken: `token-${email}`,
  deviceSessionTokens: [`token-${email}`],
  email,
  isCurrent,
})

const OWNER_EMAIL = 'owner@example.test'
const ADDED_EMAIL = 'added@example.test'

describe('useAccountSessions', () => {
  beforeEach(() => {
    loadAccountSessionsMock.mockReset()
  })

  it('loads the account list once and reuses it while the account is unchanged', async () => {
    loadAccountSessionsMock.mockResolvedValue([accountSession(OWNER_EMAIL, true)])
    const { result } = renderHook(() => useAccountSessions(OWNER_EMAIL))

    await act(async () => result.current.handleMenuOpen())
    await waitFor(() => expect(result.current.accounts).toHaveLength(1))
    await act(async () => result.current.handleMenuOpen())
    await act(async () => result.current.handleMenuOpen())

    expect(loadAccountSessionsMock).toHaveBeenCalledTimes(1)
  })

  it('falls back to the signed-in account the moment it changes', async () => {
    loadAccountSessionsMock.mockResolvedValue([accountSession(OWNER_EMAIL, true)])
    const { result, rerender } = renderHook(({ email }) => useAccountSessions(email), {
      initialProps: { email: OWNER_EMAIL },
    })

    await act(async () => result.current.handleMenuOpen())
    await waitFor(() => expect(result.current.accounts).toHaveLength(1))

    rerender({ email: ADDED_EMAIL })

    expect(result.current.accounts).toEqual([
      { activeSessionToken: '', deviceSessionTokens: [], email: ADDED_EMAIL, isCurrent: true },
    ])
  })

  it('reloads the account list after an account is added', async () => {
    loadAccountSessionsMock.mockResolvedValueOnce([accountSession(OWNER_EMAIL, true)])
    const { result, rerender } = renderHook(({ email }) => useAccountSessions(email), {
      initialProps: { email: OWNER_EMAIL },
    })

    await act(async () => result.current.handleMenuOpen())
    await waitFor(() => expect(result.current.accounts).toHaveLength(1))

    loadAccountSessionsMock.mockResolvedValueOnce([
      accountSession(OWNER_EMAIL, false),
      accountSession(ADDED_EMAIL, true),
    ])
    rerender({ email: ADDED_EMAIL })
    await act(async () => result.current.handleMenuOpen())

    await waitFor(() => {
      expect(result.current.accounts.map((account) => account.email)).toEqual([
        OWNER_EMAIL,
        ADDED_EMAIL,
      ])
    })
    expect(result.current.accounts.find((account) => account.isCurrent)?.email).toBe(ADDED_EMAIL)
    expect(loadAccountSessionsMock).toHaveBeenCalledTimes(2)
  })

  it('drops a signed-out account without refetching the list', async () => {
    loadAccountSessionsMock.mockResolvedValue([
      accountSession(OWNER_EMAIL, true),
      accountSession(ADDED_EMAIL, false),
    ])
    const { result } = renderHook(() => useAccountSessions(OWNER_EMAIL))

    await act(async () => result.current.handleMenuOpen())
    await waitFor(() => expect(result.current.accounts).toHaveLength(2))

    act(() => result.current.removeAccount(ADDED_EMAIL))
    await act(async () => result.current.handleMenuOpen())

    expect(result.current.accounts.map((account) => account.email)).toEqual([OWNER_EMAIL])
    expect(loadAccountSessionsMock).toHaveBeenCalledTimes(1)
  })
})
