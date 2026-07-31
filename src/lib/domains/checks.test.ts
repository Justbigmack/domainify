import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { DomainRow } from '@/db/schema'
import type { DomainCheckResult } from '@/lib/dns/check'
import type { CheckVerdict } from '@/lib/dns/types'

const mockState = vi.hoisted(() => ({
  currentDomain: null as Record<string, unknown> | null,
  insertedCheckValues: [] as Record<string, unknown>[],
  updateValues: [] as Record<string, unknown>[],
  attemptCount: 0,
  ownerEmail: 'owner@example.com',
}))

vi.mock('@/db', () => ({
  db: {
    select: (fields: Record<string, unknown>) => ({
      from: () => ({
        where: () =>
          'value' in fields
            ? Promise.resolve([{ value: mockState.attemptCount }])
            : Promise.resolve([{ email: mockState.ownerEmail }]),
      }),
    }),
    insert: () => ({
      values: (values: Record<string, unknown>) => ({
        returning: () => {
          mockState.insertedCheckValues.push(values)
          return Promise.resolve([{ id: 'check-1', ...values }])
        },
      }),
    }),
    update: () => ({
      set: (values: Record<string, unknown>) => ({
        where: () => ({
          returning: () => {
            mockState.updateValues.push(values)
            return Promise.resolve([{ ...mockState.currentDomain, ...values }])
          },
        }),
      }),
    }),
  },
}))

vi.mock('@/lib/dns/check', () => ({
  checkDomainOwnership: vi.fn(),
}))

vi.mock('@/lib/emails/sendDomainEmail', () => ({
  sendDomainVerifiedEmail: vi.fn(() => Promise.resolve()),
  sendGraceWarningEmail: vi.fn(() => Promise.resolve()),
}))

import { checkDomainOwnership } from '@/lib/dns/check'
import {
  sendDomainVerifiedEmail,
  sendGraceWarningEmail,
} from '@/lib/emails/sendDomainEmail'
import { runCheck } from './checks'

const HOUR_MS = 60 * 60 * 1000
const now = new Date('2026-07-26T12:00:00Z')

const makeDomain = (overrides: Partial<DomainRow>): DomainRow => {
  const domain: DomainRow = {
    id: 'domain-1',
    userId: 'user-1',
    hostname: 'example.com',
    registrableDomain: 'example.com',
    challengeHost: '_domainify-challenge.example.com',
    status: 'pending',
    verificationToken: 'token-abc',
    tokenGeneratedAt: new Date(now.getTime() - HOUR_MS),
    pendingExpiresAt: new Date(now.getTime() + 71 * HOUR_MS),
    verifiedAt: null,
    graceExpiresAt: null,
    lastCheckedAt: null,
    lastManualCheckAt: null,
    nextCheckAt: now,
    dnsProviderId: null,
    createdAt: new Date(now.getTime() - HOUR_MS),
    ...overrides,
  }
  mockState.currentDomain = domain
  return domain
}

const makeCheckResult = (verdict: CheckVerdict): DomainCheckResult => ({
  verdict,
  foundValues: verdict === 'verified' ? ['domainify-domain-verification=token-abc'] : [],
  sources: {
    authoritative:
      verdict === 'dns_error'
        ? { kind: 'lookup_error', code: 'ETIMEOUT' }
        : { kind: 'records', values: [], minTtlSeconds: null },
    cloudflare:
      verdict === 'dns_error'
        ? { kind: 'lookup_error', code: 'SERVFAIL' }
        : { kind: 'records', values: [], minTtlSeconds: 300 },
    google:
      verdict === 'dns_error'
        ? { kind: 'lookup_error', code: 'SERVFAIL' }
        : { kind: 'no_records' },
  },
  nameserverHostnames: ['dana.ns.cloudflare.com'],
  provider: null,
  authoritativeQueriedName: '_domainify-challenge.example.com',
})

const mockVerdict = (verdict: CheckVerdict) => {
  vi.mocked(checkDomainOwnership).mockResolvedValue(makeCheckResult(verdict))
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(now)
  mockState.insertedCheckValues = []
  mockState.updateValues = []
  mockState.attemptCount = 0
  vi.mocked(checkDomainOwnership).mockReset()
  vi.mocked(sendDomainVerifiedEmail).mockClear()
  vi.mocked(sendGraceWarningEmail).mockClear()
  vi.mocked(sendDomainVerifiedEmail).mockResolvedValue(undefined)
  vi.mocked(sendGraceWarningEmail).mockResolvedValue(undefined)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('runCheck', () => {
  it('verifies a pending domain, stamps verifiedAt, and emails the owner', async () => {
    mockVerdict('verified')
    const { domain } = await runCheck(makeDomain({ status: 'pending' }), 'manual')
    expect(domain.status).toBe('verified')
    expect(domain.verifiedAt?.getTime()).toBe(now.getTime())
    expect(domain.nextCheckAt?.getTime()).toBe(now.getTime() + 24 * HOUR_MS)
    expect(sendDomainVerifiedEmail).toHaveBeenCalledWith({
      recipientEmail: mockState.ownerEmail,
      hostname: 'example.com',
    })
  })

  it('moves a verified domain into grace with a deadline and a warning email', async () => {
    mockVerdict('no_record')
    const { domain } = await runCheck(makeDomain({ status: 'verified', verifiedAt: now }), 'cron')
    expect(domain.status).toBe('temporary_failure')
    expect(domain.graceExpiresAt?.getTime()).toBe(now.getTime() + 72 * HOUR_MS)
    expect(sendGraceWarningEmail).toHaveBeenCalledOnce()
    expect(sendDomainVerifiedEmail).not.toHaveBeenCalled()
  })

  it('never demotes a verified domain on a dns error and sends no email', async () => {
    mockVerdict('dns_error')
    const { domain } = await runCheck(makeDomain({ status: 'verified', verifiedAt: now }), 'cron')
    expect(domain.status).toBe('verified')
    expect(sendGraceWarningEmail).not.toHaveBeenCalled()
    expect(sendDomainVerifiedEmail).not.toHaveBeenCalled()
  })

  it('restores a temporary_failure domain and clears the grace deadline', async () => {
    mockVerdict('verified')
    const { domain } = await runCheck(
      makeDomain({
        status: 'temporary_failure',
        verifiedAt: new Date(now.getTime() - HOUR_MS),
        graceExpiresAt: new Date(now.getTime() + HOUR_MS),
      }),
      'poll',
    )
    expect(domain.status).toBe('verified')
    expect(domain.graceExpiresAt).toBeNull()
    expect(sendDomainVerifiedEmail).toHaveBeenCalledOnce()
  })

  it('fails an expired pending domain and stops scheduling checks', async () => {
    mockVerdict('no_record')
    const { domain } = await runCheck(
      makeDomain({ status: 'pending', pendingExpiresAt: new Date(now.getTime() - HOUR_MS) }),
      'cron',
    )
    expect(domain.status).toBe('failed')
    expect(domain.nextCheckAt).toBeNull()
  })

  it('records per-source snapshots and the first error code on the check row', async () => {
    mockVerdict('dns_error')
    await runCheck(makeDomain({ status: 'pending' }), 'manual')
    const [inserted] = mockState.insertedCheckValues
    expect(inserted.verdict).toBe('dns_error')
    expect(inserted.errorCode).toBe('ETIMEOUT')
    expect(inserted.sources).toHaveLength(3)
  })

  it('still returns the updated domain when the notification email fails', async () => {
    mockVerdict('verified')
    vi.mocked(sendDomainVerifiedEmail).mockRejectedValue(new Error('resend down'))
    const { domain } = await runCheck(makeDomain({ status: 'pending' }), 'manual')
    expect(domain.status).toBe('verified')
  })
})
