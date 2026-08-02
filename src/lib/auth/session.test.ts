import { beforeEach, describe, expect, it, vi } from 'vitest'

type SessionRecord = { user: { id: string; email: string } } | null
type KeyRecord = { referenceId: string } | null
type DeviceSession = {
  session: { token: string; createdAt: Date }
  user: { id: string; email: string }
}

const mockState = vi.hoisted(() => ({
  requestHeaders: new Headers(),
  session: null as SessionRecord,
  keyIsValid: false,
  key: null as KeyRecord,
  userRows: [] as { id: string; email: string }[],
  deviceSessions: [] as DeviceSession[],
}))

const getSession = vi.hoisted(() => vi.fn(() => Promise.resolve(mockState.session)))
const verifyApiKey = vi.hoisted(() =>
  vi.fn(() => Promise.resolve({ valid: mockState.keyIsValid, key: mockState.key })),
)
const listDeviceSessions = vi.hoisted(() => vi.fn(() => Promise.resolve(mockState.deviceSessions)))

vi.mock('next/headers', () => ({
  headers: () => Promise.resolve(mockState.requestHeaders),
}))

vi.mock('@/lib/auth/server', () => ({
  auth: { api: { getSession, verifyApiKey, listDeviceSessions } },
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

import { API_KEY_PREFIX } from './policy'
import { getApiRequestUser, getSessionUser, listAccountSessions } from './session'

const VALID_KEY = `${API_KEY_PREFIX}live-key`
const KEY_OWNER = { id: 'user-key', email: 'key@example.com' }
const COOKIE_OWNER = { id: 'user-cookie', email: 'cookie@example.com' }

const givenCookieSession = () => {
  mockState.session = { user: COOKIE_OWNER }
}

const givenValidApiKey = () => {
  mockState.keyIsValid = true
  mockState.key = { referenceId: KEY_OWNER.id }
  mockState.userRows = [KEY_OWNER]
}

beforeEach(() => {
  mockState.requestHeaders = new Headers()
  mockState.session = null
  mockState.keyIsValid = false
  mockState.key = null
  mockState.userRows = []
  mockState.deviceSessions = []
  vi.clearAllMocks()
})

describe('getApiRequestUser', () => {
  it('returns the key owner for a valid API key', async () => {
    mockState.requestHeaders.set('authorization', `Bearer ${VALID_KEY}`)
    givenValidApiKey()

    await expect(getApiRequestUser()).resolves.toEqual(KEY_OWNER)
  })

  it('does not fall back to the cookie session when an API key authenticates', async () => {
    mockState.requestHeaders.set('authorization', `Bearer ${VALID_KEY}`)
    givenValidApiKey()
    givenCookieSession()

    await expect(getApiRequestUser()).resolves.toEqual(KEY_OWNER)
    expect(getSession).not.toHaveBeenCalled()
  })

  it('tolerates surrounding whitespace in the bearer value', async () => {
    mockState.requestHeaders.set('authorization', `Bearer  ${VALID_KEY} `)
    givenValidApiKey()

    await expect(getApiRequestUser()).resolves.toEqual(KEY_OWNER)
    expect(verifyApiKey).toHaveBeenCalledWith({ body: { key: VALID_KEY } })
  })

  it('rejects a key that fails verification', async () => {
    mockState.requestHeaders.set('authorization', `Bearer ${API_KEY_PREFIX}revoked`)
    mockState.keyIsValid = false

    await expect(getApiRequestUser()).resolves.toBeNull()
  })

  it('rejects a valid key whose owner no longer exists', async () => {
    mockState.requestHeaders.set('authorization', `Bearer ${VALID_KEY}`)
    givenValidApiKey()
    mockState.userRows = []

    await expect(getApiRequestUser()).resolves.toBeNull()
  })

  it.each([
    ['a token without the domainify prefix', 'Bearer sk-live-not-ours'],
    ['a non-bearer scheme', `Basic ${VALID_KEY}`],
  ])('never verifies %s as an API key', async (_label, authorization) => {
    mockState.requestHeaders.set('authorization', authorization)
    givenCookieSession()

    await expect(getApiRequestUser()).resolves.toEqual(COOKIE_OWNER)
    expect(verifyApiKey).not.toHaveBeenCalled()
  })

  it('falls back to the cookie session when no authorization header is sent', async () => {
    givenCookieSession()

    await expect(getApiRequestUser()).resolves.toEqual(COOKIE_OWNER)
  })

  it('returns null when neither an API key nor a session is present', async () => {
    await expect(getApiRequestUser()).resolves.toBeNull()
  })
})

describe('getSessionUser', () => {
  it('exposes only the id and email of the signed-in user', async () => {
    mockState.session = {
      user: { ...COOKIE_OWNER, ...{ name: 'Cookie Owner', image: null } },
    }

    await expect(getSessionUser()).resolves.toEqual(COOKIE_OWNER)
  })

  it('returns null without a session', async () => {
    await expect(getSessionUser()).resolves.toBeNull()
  })
})

describe('listAccountSessions', () => {
  const makeDeviceSession = (
    id: string,
    email: string,
    token: string,
    createdAt: string,
  ): DeviceSession => ({
    session: { token, createdAt: new Date(createdAt) },
    user: { id, email },
  })

  it('returns no accounts when signed out', async () => {
    mockState.deviceSessions = [
      makeDeviceSession('user-a', 'a@example.com', 'token-a', '2026-08-01T10:00:00Z'),
    ]

    await expect(listAccountSessions()).resolves.toEqual([])
  })

  it('collapses multiple sessions for one account onto its newest token', async () => {
    givenCookieSession()
    mockState.deviceSessions = [
      makeDeviceSession(COOKIE_OWNER.id, COOKIE_OWNER.email, 'newest', '2026-08-02T10:00:00Z'),
      makeDeviceSession(COOKIE_OWNER.id, COOKIE_OWNER.email, 'oldest', '2026-08-01T10:00:00Z'),
    ]

    await expect(listAccountSessions()).resolves.toEqual([
      { sessionToken: 'newest', email: COOKIE_OWNER.email, isCurrent: true },
    ])
  })

  it('orders accounts by first sign-in and flags the current one', async () => {
    givenCookieSession()
    mockState.deviceSessions = [
      makeDeviceSession(COOKIE_OWNER.id, COOKIE_OWNER.email, 'token-current', '2026-08-02T10:00:00Z'),
      makeDeviceSession('user-other', 'other@example.com', 'token-other', '2026-08-01T10:00:00Z'),
    ]

    await expect(listAccountSessions()).resolves.toEqual([
      { sessionToken: 'token-other', email: 'other@example.com', isCurrent: false },
      { sessionToken: 'token-current', email: COOKIE_OWNER.email, isCurrent: true },
    ])
  })
})
