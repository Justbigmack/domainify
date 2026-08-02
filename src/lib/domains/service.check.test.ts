import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { DomainRow, VerificationCheckRow } from '@/db/schema'
import { FIXTURE_NOW, makeDomain } from './domainFixture'

const mockState = vi.hoisted(() => ({
  ownedDomains: [] as DomainRow[],
  recentChecks: [] as VerificationCheckRow[],
  updatedValues: [] as Record<string, unknown>[],
  deleteCount: 0,
  scheduledTasks: [] as (() => unknown)[],
}))

const runCheck = vi.hoisted(() => vi.fn(() => Promise.resolve({ verdict: 'no_record' })))

vi.mock('@/db', async () => {
  const { verificationChecks } = await import('@/db/schema')
  type Row = DomainRow | VerificationCheckRow
  const chainFor = (rows: () => Row[]) => {
    const chain = {
      where: () => chain,
      orderBy: () => chain,
      limit: () => chain,
      returning: () => Promise.resolve(rows()),
      then: <Fulfilled, Rejected = never>(
        onFulfilled?: ((value: Row[]) => Fulfilled | PromiseLike<Fulfilled>) | null,
        onRejected?: ((reason: unknown) => Rejected | PromiseLike<Rejected>) | null,
      ) => Promise.resolve(rows()).then(onFulfilled, onRejected),
    }
    return chain
  }
  return {
    db: {
      select: () => ({
        from: (table: unknown) =>
          chainFor(() =>
            table === verificationChecks ? mockState.recentChecks : mockState.ownedDomains,
          ),
      }),
      update: () => ({
        set: (values: Record<string, unknown>) => {
          mockState.updatedValues.push(values)
          return chainFor(() => mockState.ownedDomains)
        },
      }),
      delete: () => ({
        where: () => {
          mockState.deleteCount += 1
          return Promise.resolve()
        },
      }),
    },
  }
})

vi.mock('next/server', () => ({
  after: (task: () => unknown) => {
    mockState.scheduledTasks.push(task)
  },
}))

vi.mock('./checks', () => ({ runCheck }))

import {
  MANUAL_CHECK_COOLDOWN_MS,
  POLL_CHECK_COOLDOWN_MS,
  STALE_CHECK_THRESHOLD_MS,
} from './constants'
import { DomainNotFoundError, VerifyCooldownError } from './errors'
import {
  deleteDomain,
  getDomainDetail,
  getDomainForUser,
  pollDomain,
  verifyDomain,
} from './service'

const USER_ID = 'user-1'
const DOMAIN_ID = 'domain-1'
const SECOND_MS = 1000

const givenDomain = (overrides: Partial<DomainRow> = {}) => {
  const domain = makeDomain(overrides)
  mockState.ownedDomains = [domain]
  return domain
}

const agoMs = (ms: number): Date => new Date(FIXTURE_NOW.getTime() - ms)

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(FIXTURE_NOW)
  mockState.ownedDomains = []
  mockState.recentChecks = []
  mockState.updatedValues = []
  mockState.deleteCount = 0
  mockState.scheduledTasks = []
  runCheck.mockClear()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('ownership', () => {
  it.each([
    ['getDomainForUser', () => getDomainForUser(USER_ID, DOMAIN_ID)],
    ['getDomainDetail', () => getDomainDetail(USER_ID, DOMAIN_ID)],
    ['verifyDomain', () => verifyDomain(USER_ID, DOMAIN_ID)],
    ['pollDomain', () => pollDomain(USER_ID, DOMAIN_ID)],
    ['deleteDomain', () => deleteDomain(USER_ID, DOMAIN_ID)],
  ])('%s refuses a domain the user does not own', async (_label, call) => {
    mockState.ownedDomains = []

    await expect(call()).rejects.toThrow(DomainNotFoundError)
    expect(mockState.deleteCount).toBe(0)
    expect(runCheck).not.toHaveBeenCalled()
  })
})

describe('verifyDomain', () => {
  it('runs a manual check when the domain has never been checked by hand', async () => {
    const domain = givenDomain({ lastManualCheckAt: null })

    await verifyDomain(USER_ID, DOMAIN_ID)

    expect(runCheck).toHaveBeenCalledWith(
      { ...domain, lastManualCheckAt: FIXTURE_NOW },
      'manual',
    )
  })

  it('stamps the manual check before running it', async () => {
    givenDomain({ lastManualCheckAt: null })

    await verifyDomain(USER_ID, DOMAIN_ID)

    expect(mockState.updatedValues).toEqual([{ lastManualCheckAt: FIXTURE_NOW }])
  })

  it('reports the remaining wait while the manual cooldown is active', async () => {
    givenDomain({ lastManualCheckAt: agoMs(SECOND_MS) })

    await expect(verifyDomain(USER_ID, DOMAIN_ID)).rejects.toThrow(VerifyCooldownError)
    expect(runCheck).not.toHaveBeenCalled()
    expect(mockState.updatedValues).toEqual([])
  })

  it('allows the next manual check once the cooldown has elapsed', async () => {
    givenDomain({ lastManualCheckAt: agoMs(MANUAL_CHECK_COOLDOWN_MS) })

    await expect(verifyDomain(USER_ID, DOMAIN_ID)).resolves.toBeDefined()
  })
})

describe('pollDomain', () => {
  it('runs a poll check when the poll cooldown has elapsed', async () => {
    const domain = givenDomain({ lastCheckedAt: agoMs(POLL_CHECK_COOLDOWN_MS) })

    await pollDomain(USER_ID, DOMAIN_ID)

    expect(runCheck).toHaveBeenCalledWith(domain, 'poll')
  })

  it('reports the remaining wait while the poll cooldown is active', async () => {
    givenDomain({ lastCheckedAt: agoMs(POLL_CHECK_COOLDOWN_MS - SECOND_MS) })

    const cooldown = await pollDomain(USER_ID, DOMAIN_ID).catch(
      (error: VerifyCooldownError) => error,
    )

    expect(cooldown).toBeInstanceOf(VerifyCooldownError)
    expect((cooldown as VerifyCooldownError).retryAfterMs).toBe(SECOND_MS)
    expect(runCheck).not.toHaveBeenCalled()
  })
})

describe('getDomainDetail', () => {
  it('returns the TXT record the user has to publish', async () => {
    const domain = givenDomain({ verificationToken: 'token-abc' })

    const detail = await getDomainDetail(USER_ID, DOMAIN_ID)

    expect(detail.record).toEqual({
      type: 'TXT',
      host: domain.challengeHost,
      value: 'domainify-domain-verification=token-abc',
    })
  })

  it.each([
    ['never checked', { lastCheckedAt: null }],
    ['checked long ago', { lastCheckedAt: agoMs(STALE_CHECK_THRESHOLD_MS + SECOND_MS) }],
  ])('refreshes a %s domain in the background', async (_label, overrides) => {
    givenDomain(overrides)

    await getDomainDetail(USER_ID, DOMAIN_ID)

    expect(mockState.scheduledTasks).toHaveLength(1)
  })

  it('leaves a recently checked domain alone', async () => {
    givenDomain({ lastCheckedAt: agoMs(SECOND_MS) })

    await getDomainDetail(USER_ID, DOMAIN_ID)

    expect(mockState.scheduledTasks).toEqual([])
  })

  it('never re-checks a failed domain', async () => {
    givenDomain({ status: 'failed', lastCheckedAt: null })

    await getDomainDetail(USER_ID, DOMAIN_ID)

    expect(mockState.scheduledTasks).toEqual([])
  })
})

describe('deleteDomain', () => {
  it('removes a domain the user owns', async () => {
    givenDomain()

    await deleteDomain(USER_ID, DOMAIN_ID)

    expect(mockState.deleteCount).toBe(1)
  })
})
