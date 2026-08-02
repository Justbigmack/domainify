import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { DomainRow } from '@/db/schema'
import { FIXTURE_NOW, makeDomain } from './domainFixture'

const mockState = vi.hoisted(() => ({
  dueDomains: [] as DomainRow[],
}))

const runCheck = vi.hoisted(() => vi.fn(() => Promise.resolve({ verdict: 'no_record' })))

vi.mock('@/db', () => {
  const chain = {
    where: () => chain,
    orderBy: () => chain,
    limit: () => Promise.resolve(mockState.dueDomains),
  }
  return { db: { select: () => ({ from: () => chain }) } }
})

vi.mock('next/server', () => ({ after: vi.fn() }))
vi.mock('./checks', () => ({ runCheck }))

import { sweepDueDomains } from './service'

const CRON_CONCURRENCY = 5
const CRON_BATCH_SIZE = 25
const SWEEP_DEADLINE_MS = 250 * 1000
const PER_CHECK_ELAPSED_MS = (SWEEP_DEADLINE_MS / CRON_CONCURRENCY) * 0.4

const makeDueDomains = (count: number, userIdFor: (index: number) => string): DomainRow[] =>
  Array.from({ length: count }, (_unused, index) =>
    makeDomain({ id: `domain-${index}`, userId: userIdFor(index) }),
  )

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(FIXTURE_NOW)
  mockState.dueDomains = []
  runCheck.mockReset()
  runCheck.mockResolvedValue({ verdict: 'no_record' })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('sweepDueDomains', () => {
  it('reports an empty sweep when nothing is due', async () => {
    await expect(sweepDueDomains(FIXTURE_NOW)).resolves.toEqual({
      checked: 0,
      failed: 0,
      remaining: 0,
      affectedUserIds: [],
    })
    expect(runCheck).not.toHaveBeenCalled()
  })

  it('checks every due domain with the cron trigger', async () => {
    mockState.dueDomains = makeDueDomains(3, () => 'user-1')

    const sweep = await sweepDueDomains(FIXTURE_NOW)

    expect(runCheck).toHaveBeenCalledTimes(3)
    expect(runCheck).toHaveBeenCalledWith(mockState.dueDomains[0], 'cron')
    expect(sweep).toEqual({
      checked: 3,
      failed: 0,
      remaining: 0,
      affectedUserIds: ['user-1'],
    })
  })

  it('keeps sweeping after an individual check throws', async () => {
    mockState.dueDomains = makeDueDomains(3, () => 'user-1')
    runCheck.mockRejectedValueOnce(new Error('resolver timed out'))

    const sweep = await sweepDueDomains(FIXTURE_NOW)

    expect(runCheck).toHaveBeenCalledTimes(3)
    expect(sweep.checked).toBe(2)
    expect(sweep.failed).toBe(1)
    expect(sweep.remaining).toBe(0)
  })

  it('lists each affected owner once so the cache is refreshed once', async () => {
    mockState.dueDomains = makeDueDomains(6, (index) => `user-${index % 2}`)

    const sweep = await sweepDueDomains(FIXTURE_NOW)

    expect(sweep.affectedUserIds).toEqual(['user-0', 'user-1'])
  })

  it('stops at the run deadline and reports the untouched domains as remaining', async () => {
    mockState.dueDomains = makeDueDomains(CRON_BATCH_SIZE, () => 'user-1')
    runCheck.mockImplementation(() => {
      vi.advanceTimersByTime(PER_CHECK_ELAPSED_MS)
      return Promise.resolve({ verdict: 'no_record' })
    })

    const sweep = await sweepDueDomains(FIXTURE_NOW)

    expect(sweep.checked).toBe(15)
    expect(sweep.remaining).toBe(CRON_BATCH_SIZE - 15)
    expect(runCheck).toHaveBeenCalledTimes(15)
  })

  it('counts only the owners it actually processed before the deadline', async () => {
    mockState.dueDomains = makeDueDomains(CRON_BATCH_SIZE, (index) =>
      index < 15 ? 'user-early' : 'user-late',
    )
    runCheck.mockImplementation(() => {
      vi.advanceTimersByTime(PER_CHECK_ELAPSED_MS)
      return Promise.resolve({ verdict: 'no_record' })
    })

    const sweep = await sweepDueDomains(FIXTURE_NOW)

    expect(sweep.affectedUserIds).toEqual(['user-early'])
  })
})
