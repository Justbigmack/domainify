import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { SweepResult } from '@/lib/domains/server/service'

const revalidateTag = vi.hoisted(() => vi.fn())
const sweepDueDomains = vi.hoisted(() => vi.fn())
const after = vi.hoisted(() => vi.fn())

vi.mock('next/cache', () => ({
  revalidateTag,
  cacheTag: vi.fn(),
  cacheLife: vi.fn(),
}))

vi.mock('next/server', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/server')>()),
  after,
}))

vi.mock('@/lib/domains/server/service', () => ({ sweepDueDomains }))

import { GET as revalidateRoute } from './route'

const CRON_SECRET = 'test-cron-secret'
const originalCronSecret = process.env.CRON_SECRET

const cronRequest = (authorization?: string): Request =>
  new Request('https://domainify.test/api/cron/revalidate', {
    headers: authorization === undefined ? undefined : { authorization },
  })

const sweepResult = (overrides: Partial<SweepResult> = {}): SweepResult => ({
  checked: 0,
  failed: 0,
  remaining: 0,
  affectedUserIds: [],
  ...overrides,
})

beforeEach(() => {
  process.env.CRON_SECRET = CRON_SECRET
  sweepDueDomains.mockResolvedValue(sweepResult())
  vi.clearAllMocks()
  vi.spyOn(console, 'log').mockImplementation(() => undefined)
})

afterEach(() => {
  process.env.CRON_SECRET = originalCronSecret
  vi.restoreAllMocks()
})

describe('cron authorization', () => {
  it.each([
    ['no authorization header', undefined],
    ['the wrong secret', 'Bearer not-the-secret'],
    ['a bare secret without the scheme', CRON_SECRET],
    ['a mismatched scheme', `Basic ${CRON_SECRET}`],
  ])('rejects %s', async (_label, authorization) => {
    const response = await revalidateRoute(cronRequest(authorization))

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({
      error: { code: 'unauthorized', message: 'Unauthorized' },
    })
    expect(sweepDueDomains).not.toHaveBeenCalled()
  })

  it('rejects every caller when CRON_SECRET is unset', async () => {
    delete process.env.CRON_SECRET

    const responses = await Promise.all([
      revalidateRoute(cronRequest()),
      revalidateRoute(cronRequest('Bearer undefined')),
      revalidateRoute(cronRequest('Bearer ')),
    ])

    for (const response of responses) {
      expect(response.status).toBe(401)
    }
    expect(sweepDueDomains).not.toHaveBeenCalled()
  })
})

const runDeferredSweep = async (): Promise<void> => {
  const deferred = after.mock.calls.at(-1)?.[0]
  await deferred?.()
}

describe('sweep fan-out', () => {
  it('acknowledges the trigger before the sweep runs', async () => {
    const response = await revalidateRoute(cronRequest(`Bearer ${CRON_SECRET}`))

    expect(response.status).toBe(202)
    await expect(response.json()).resolves.toEqual({ started: true })
    expect(sweepDueDomains).not.toHaveBeenCalled()
    expect(after).toHaveBeenCalledTimes(1)
  })

  it('revalidates the domain list once per affected user', async () => {
    sweepDueDomains.mockResolvedValue(
      sweepResult({ checked: 3, affectedUserIds: ['user-1', 'user-2'] }),
    )

    await revalidateRoute(cronRequest(`Bearer ${CRON_SECRET}`))
    await runDeferredSweep()

    expect(sweepDueDomains).toHaveBeenCalledTimes(1)
    expect(revalidateTag).toHaveBeenCalledTimes(2)
    expect(revalidateTag).toHaveBeenCalledWith('domains-user-1', 'max')
    expect(revalidateTag).toHaveBeenCalledWith('domains-user-2', 'max')
  })

  it('revalidates nothing when no domain was due', async () => {
    await revalidateRoute(cronRequest(`Bearer ${CRON_SECRET}`))
    await runDeferredSweep()

    expect(revalidateTag).not.toHaveBeenCalled()
  })

  it('swallows a failing sweep so the function survives the rejection', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    sweepDueDomains.mockRejectedValue(new Error('neon unreachable'))

    await revalidateRoute(cronRequest(`Bearer ${CRON_SECRET}`))

    await expect(runDeferredSweep()).resolves.toBeUndefined()
    expect(consoleError).toHaveBeenCalled()
    expect(revalidateTag).not.toHaveBeenCalled()
    consoleError.mockRestore()
  })
})
