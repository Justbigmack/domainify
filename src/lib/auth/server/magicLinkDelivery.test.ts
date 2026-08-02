import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type UserRow = { id: string; email: string }

const mockState = vi.hoisted(() => ({
  userRows: [] as UserRow[],
  lookupEmail: null as string | null,
}))

const sendMagicLinkEmail = vi.hoisted(() => vi.fn(() => Promise.resolve()))

vi.mock('@/lib/emails/sendMagicLink', () => ({ sendMagicLinkEmail }))

vi.mock('drizzle-orm', () => ({
  eq: (_column: unknown, value: string) => {
    mockState.lookupEmail = value
    return { value }
  },
}))

vi.mock('@/db', () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({ limit: () => Promise.resolve(mockState.userRows) }),
      }),
    }),
  },
}))

vi.mock('@/db/authSchema', () => ({ user: { id: 'id', email: 'email' } }))

import { MAGIC_LINK_RESPONSE_FLOOR_MS, deliverMagicLinkToExistingUser } from './magicLinkDelivery'

const MAGIC_LINK_URL = 'http://localhost:3000/api/auth/magic-link/verify?token=abc'
const KNOWN_USER: UserRow = { id: 'user_1', email: 'owner@example.com' }

const deliver = (email: string) =>
  deliverMagicLinkToExistingUser({ email, magicLinkUrl: MAGIC_LINK_URL })

const settle = async (delivery: Promise<void>): Promise<'settled' | 'pending'> => {
  const outcome = await Promise.race([
    delivery.then(() => 'settled' as const),
    Promise.resolve().then(() => 'pending' as const),
  ])
  return outcome
}

describe('deliverMagicLinkToExistingUser', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mockState.userRows = []
    mockState.lookupEmail = null
    sendMagicLinkEmail.mockClear()
    sendMagicLinkEmail.mockImplementation(() => Promise.resolve())
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('sends the link when an account exists for the email', async () => {
    mockState.userRows = [KNOWN_USER]

    const delivery = deliver('owner@example.com')
    await vi.runAllTimersAsync()
    await delivery

    expect(sendMagicLinkEmail).toHaveBeenCalledWith({
      recipientEmail: 'owner@example.com',
      magicLinkUrl: MAGIC_LINK_URL,
    })
  })

  it('sends nothing when no account exists for the email', async () => {
    mockState.userRows = []

    const delivery = deliver('stranger@example.com')
    await vi.runAllTimersAsync()
    await delivery

    expect(sendMagicLinkEmail).not.toHaveBeenCalled()
  })

  it('looks the account up by lowercased email, matching verification', async () => {
    mockState.userRows = [KNOWN_USER]

    const delivery = deliver('  Owner@Example.COM ')
    await vi.runAllTimersAsync()
    await delivery

    expect(mockState.lookupEmail).toBe('owner@example.com')
  })

  it('delivers to the stored address rather than the typed casing', async () => {
    mockState.userRows = [KNOWN_USER]

    const delivery = deliver('OWNER@EXAMPLE.COM')
    await vi.runAllTimersAsync()
    await delivery

    expect(sendMagicLinkEmail).toHaveBeenCalledWith({
      recipientEmail: 'owner@example.com',
      magicLinkUrl: MAGIC_LINK_URL,
    })
  })

  it('holds the unknown-account path until the response floor', async () => {
    mockState.userRows = []

    const delivery = deliver('stranger@example.com')
    await vi.advanceTimersByTimeAsync(MAGIC_LINK_RESPONSE_FLOOR_MS - 1)
    expect(await settle(delivery)).toBe('pending')

    await vi.runAllTimersAsync()
    await expect(delivery).resolves.toBeUndefined()
  })

  it('holds the known-account path until the same response floor', async () => {
    mockState.userRows = [KNOWN_USER]

    const delivery = deliver('owner@example.com')
    await vi.advanceTimersByTimeAsync(MAGIC_LINK_RESPONSE_FLOOR_MS - 1)
    expect(await settle(delivery)).toBe('pending')

    await vi.runAllTimersAsync()
    await expect(delivery).resolves.toBeUndefined()
  })

  it('still honours the floor when the email provider fails, without throwing', async () => {
    mockState.userRows = [KNOWN_USER]
    sendMagicLinkEmail.mockImplementation(() => Promise.reject(new Error('resend is down')))

    const delivery = deliver('owner@example.com')
    await vi.advanceTimersByTimeAsync(MAGIC_LINK_RESPONSE_FLOOR_MS - 1)
    expect(await settle(delivery)).toBe('pending')

    await vi.runAllTimersAsync()
    await expect(delivery).resolves.toBeUndefined()
  })

  it('logs provider failures server-side so they are not silently lost', async () => {
    mockState.userRows = [KNOWN_USER]
    const providerError = new Error('resend is down')
    sendMagicLinkEmail.mockImplementation(() => Promise.reject(providerError))

    const delivery = deliver('owner@example.com')
    await vi.runAllTimersAsync()
    await delivery

    expect(console.error).toHaveBeenCalledWith('Magic link delivery failed', providerError)
  })
})
