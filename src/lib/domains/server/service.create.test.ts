import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { DomainRow } from '@/db/schema'

const mockState = vi.hoisted(() => ({
  insertedValues: null as Record<string, unknown> | null,
  insertError: null as Error | null,
  nameserverHostnames: [] as string[],
  hangsOnNameservers: false,
}))

vi.mock('@/db', () => ({
  db: {
    insert: () => ({
      values: (values: Record<string, unknown>) => ({
        returning: () => {
          if (mockState.insertError) return Promise.reject(mockState.insertError)
          mockState.insertedValues = values
          return Promise.resolve([{ id: 'domain-1', ...values }])
        },
      }),
    }),
  },
}))

vi.mock('next/server', () => ({ after: vi.fn() }))

const neverSettles = (): Promise<string[]> => new Promise(() => {})

vi.mock('@/lib/dns/resolver', () => ({
  resolveNameserverHostnames: () =>
    mockState.hangsOnNameservers ? neverSettles() : Promise.resolve(mockState.nameserverHostnames),
}))

vi.mock('./checks', () => ({ runCheck: vi.fn() }))

import { PROVIDER_DETECTION_TIMEOUT_MS } from '@/lib/dns/constants'
import { PENDING_WINDOW_MS } from '@/lib/domains/model/constants'
import { DomainInputInvalidError, DuplicateDomainError } from '@/lib/domains/model/errors'
import { createDomain } from './service'

const USER_ID = 'user-1'

const uniqueViolation = (): Error =>
  Object.assign(new Error('duplicate key value violates unique constraint'), { code: '23505' })

beforeEach(() => {
  vi.useRealTimers()
  mockState.insertedValues = null
  mockState.insertError = null
  mockState.nameserverHostnames = []
  mockState.hangsOnNameservers = false
})

describe('createDomain', () => {
  it('stores the normalized hostname and its challenge host', async () => {
    const created = await createDomain(USER_ID, '  HTTPS://WWW.Example.com/path  ')

    expect(created.hostname).toBe('www.example.com')
    expect(created.registrableDomain).toBe('example.com')
    expect(created.challengeHost).toBe('_domainify-challenge.www.example.com')
    expect(created.userId).toBe(USER_ID)
  })

  it('opens a verification window that closes after the pending period', async () => {
    const created = (await createDomain(USER_ID, 'example.com')) as DomainRow

    expect(created.pendingExpiresAt.getTime()).toBe(
      created.tokenGeneratedAt.getTime() + PENDING_WINDOW_MS,
    )
  })

  it('queues the domain for an immediate first check', async () => {
    const startedAt = Date.now()

    const created = (await createDomain(USER_ID, 'example.com')) as DomainRow

    expect(created.nextCheckAt?.getTime()).toBeGreaterThanOrEqual(startedAt)
    expect(created.nextCheckAt?.getTime()).toBeLessThanOrEqual(Date.now())
  })

  it('mints a distinct verification token per domain', async () => {
    const first = await createDomain(USER_ID, 'example.com')
    const second = await createDomain(USER_ID, 'other.com')

    expect(first.verificationToken).not.toBe(second.verificationToken)
    expect(first.verificationToken.length).toBeGreaterThan(0)
  })

  it('stores the DNS provider detected from the nameservers', async () => {
    mockState.nameserverHostnames = ['kim.ns.cloudflare.com', 'walt.ns.cloudflare.com']

    const created = (await createDomain(USER_ID, 'example.com')) as DomainRow

    expect(created.dnsProviderId).toBe('cloudflare')
  })

  it('stops waiting on nameservers that never answer', async () => {
    vi.useFakeTimers()
    mockState.hangsOnNameservers = true

    const creation = createDomain(USER_ID, 'example.com')
    await vi.advanceTimersByTimeAsync(PROVIDER_DETECTION_TIMEOUT_MS)

    expect(((await creation) as DomainRow).dnsProviderId).toBeNull()
  })

  it('leaves the DNS provider unset when the nameservers match none', async () => {
    mockState.nameserverHostnames = ['ns1.unknown-registrar.test']

    const created = (await createDomain(USER_ID, 'example.com')) as DomainRow

    expect(created.dnsProviderId).toBeNull()
  })

  it.each([
    ['an empty input', '   ', 'empty'],
    ['a bare public suffix', 'co.uk', 'public_suffix'],
    ['an IP address', '203.0.113.10', 'ip_address'],
  ])('rejects %s before touching the database', async (_label, input, code) => {
    await expect(createDomain(USER_ID, input)).rejects.toThrow(DomainInputInvalidError)
    expect(mockState.insertedValues).toBeNull()

    await createDomain(USER_ID, input).catch((error: DomainInputInvalidError) => {
      expect(error.detail.code).toBe(code)
    })
  })

  it('reports a domain the user already added', async () => {
    mockState.insertError = uniqueViolation()

    await expect(createDomain(USER_ID, 'example.com')).rejects.toThrow(DuplicateDomainError)
    await expect(createDomain(USER_ID, 'example.com')).rejects.toThrow(
      "You've already added example.com.",
    )
  })

  it('recognises a unique violation wrapped in a driver error', async () => {
    mockState.insertError = Object.assign(new Error('write failed'), {
      cause: uniqueViolation(),
    })

    await expect(createDomain(USER_ID, 'example.com')).rejects.toThrow(DuplicateDomainError)
  })

  it('lets an unrelated database failure escape', async () => {
    mockState.insertError = new Error('connection terminated')

    await expect(createDomain(USER_ID, 'example.com')).rejects.toThrow('connection terminated')
  })
})
