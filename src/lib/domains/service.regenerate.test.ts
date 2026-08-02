import { describe, expect, it, vi } from 'vitest'
import type { DomainRow } from '@/db/schema'
import { FIXTURE_NOW, makeDomain } from './domainFixture'
import type { DomainStatus } from './status'

const mockState = vi.hoisted(() => ({
  currentDomain: null as DomainRow | null,
}))

vi.mock('@/db', () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => Promise.resolve([mockState.currentDomain]),
      }),
    }),
    update: () => ({
      set: (values: Record<string, unknown>) => ({
        where: () => ({
          returning: () => Promise.resolve([{ ...mockState.currentDomain, ...values }]),
        }),
      }),
    }),
  },
}))

vi.mock('next/server', () => ({
  after: (task: () => Promise<void>) => {
    void task()
  },
}))

vi.mock('./checks', () => ({ runCheck: vi.fn(() => Promise.resolve(null)) }))

import { PENDING_WINDOW_MS } from './constants'
import { regenerateToken, restartVerification } from './service'

const HOUR_MS = 60 * 60 * 1000
const now = FIXTURE_NOW

const EVERY_STATUS: DomainStatus[] = ['pending', 'verified', 'temporary_failure', 'failed']

describe('regenerateToken', () => {
  it.each(EVERY_STATUS)('reopens the verification window from %s', async (status) => {
    mockState.currentDomain = makeDomain({
      status,
      verifiedAt: status === 'pending' ? null : new Date(now.getTime() - 90 * HOUR_MS),
      graceExpiresAt: status === 'temporary_failure' ? new Date(now.getTime() - HOUR_MS) : null,
    })
    const startedAt = Date.now()

    const updated = await regenerateToken('user-1', 'domain-1')

    expect(updated.verificationToken).not.toBe('old-token')
    expect(updated.status).toBe('pending')
    expect(updated.verifiedAt).toBeNull()
    expect(updated.graceExpiresAt).toBeNull()
    expect(updated.nextCheckAt?.getTime()).toBeGreaterThanOrEqual(startedAt)
    expect(updated.pendingExpiresAt.getTime()).toBe(
      updated.tokenGeneratedAt.getTime() + PENDING_WINDOW_MS,
    )
  })
})

describe('restartVerification', () => {
  it('matches regenerateToken for a failed domain', async () => {
    mockState.currentDomain = makeDomain({ status: 'failed' })

    const restarted = await restartVerification('user-1', 'domain-1')

    expect(restarted.status).toBe('pending')
    expect(restarted.verificationToken).not.toBe('old-token')
    expect(restarted.pendingExpiresAt.getTime()).toBe(
      restarted.tokenGeneratedAt.getTime() + PENDING_WINDOW_MS,
    )
  })

  it('rejects a domain that has not failed', async () => {
    mockState.currentDomain = makeDomain({ status: 'pending' })

    await expect(restartVerification('user-1', 'domain-1')).rejects.toThrow()
  })
})
