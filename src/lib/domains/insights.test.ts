import { describe, expect, it } from 'vitest'
import type { CheckSourceSnapshot } from '@/lib/dns/types'
import { deriveDiagnosis, deriveDomainEvents, deriveSourcePills } from './insights'
import type { CheckView, DomainView } from './view'

const EXPECTED = 'domainify-domain-verification=token-abcdef'

const baseDomain: DomainView = {
  id: 'd1',
  hostname: 'example.com',
  registrableDomain: 'example.com',
  challengeHost: '_domainify-challenge.example.com',
  status: 'pending',
  createdAt: '2026-07-26T10:00:00.000Z',
  tokenGeneratedAt: '2026-07-26T10:00:00.000Z',
  pendingExpiresAt: '2026-07-29T10:00:00.000Z',
  verifiedAt: null,
  graceExpiresAt: null,
  lastCheckedAt: null,
  dnsProviderId: null,
}

const makeCheck = (overrides: Partial<CheckView>): CheckView => ({
  id: 'c1',
  checkedAt: '2026-07-26T10:05:00.000Z',
  trigger: 'manual',
  verdict: 'no_record',
  foundValues: [],
  sources: [],
  errorCode: null,
  ...overrides,
})

const snapshot = (overrides: Partial<CheckSourceSnapshot>): CheckSourceSnapshot => ({
  source: 'authoritative',
  kind: 'records',
  values: [],
  minTtlSeconds: null,
  errorCode: null,
  ...overrides,
})

describe('deriveDomainEvents', () => {
  it('shows upcoming detection and verification for a fresh pending domain', () => {
    const events = deriveDomainEvents(baseDomain, [], EXPECTED)
    expect(events.map((event) => event.key)).toEqual(['added', 'record_detected', 'verified'])
    expect(events[1].at).toBeNull()
    expect(events[2].at).toBeNull()
  })

  it('dates detection from the first check that saw the token', () => {
    const checks = [
      makeCheck({ id: 'late', checkedAt: '2026-07-26T10:10:00.000Z', verdict: 'verified' }),
      makeCheck({ id: 'early', checkedAt: '2026-07-26T10:05:00.000Z', foundValues: [EXPECTED] }),
    ]
    const events = deriveDomainEvents(
      { ...baseDomain, status: 'verified', verifiedAt: '2026-07-26T10:10:00.000Z' },
      checks,
      EXPECTED,
    )
    expect(events.find((event) => event.key === 'record_detected')?.at).toBe(
      '2026-07-26T10:05:00.000Z',
    )
  })

  it('adds a restarted event when the token is newer than the domain', () => {
    const events = deriveDomainEvents(
      { ...baseDomain, tokenGeneratedAt: '2026-07-26T12:00:00.000Z' },
      [],
      EXPECTED,
    )
    expect(events[1].key).toBe('restarted')
  })

  it('ends the timeline at failure for failed domains', () => {
    const events = deriveDomainEvents({ ...baseDomain, status: 'failed' }, [], EXPECTED)
    expect(events.at(-1)?.key).toBe('failed')
    expect(events.some((event) => event.key === 'verified')).toBe(false)
  })

  it('marks the grace start when a verified domain loses its record', () => {
    const events = deriveDomainEvents(
      {
        ...baseDomain,
        status: 'temporary_failure',
        verifiedAt: '2026-07-26T11:00:00.000Z',
        graceExpiresAt: '2026-07-30T12:00:00.000Z',
      },
      [],
      EXPECTED,
    )
    expect(events.at(-1)).toEqual({
      key: 'record_missing',
      label: 'Record missing',
      at: '2026-07-27T12:00:00.000Z',
    })
  })
})

describe('deriveSourcePills', () => {
  it('reports every source as unchecked without a check', () => {
    const pills = deriveSourcePills(null, EXPECTED)
    expect(pills).toHaveLength(3)
    expect(pills.every((pill) => pill.state === 'unchecked')).toBe(true)
  })

  it('classifies match, missing-with-ttl, and error states', () => {
    const check = makeCheck({
      sources: [
        snapshot({ source: 'authoritative', values: [EXPECTED] }),
        snapshot({ source: 'doh_cloudflare', kind: 'no_records', minTtlSeconds: 300 }),
        snapshot({ source: 'doh_google', kind: 'lookup_error', errorCode: 'SERVFAIL' }),
      ],
    })
    const [authoritative, cloudflare, google] = deriveSourcePills(check, EXPECTED)
    expect(authoritative.state).toBe('match')
    expect(cloudflare.state).toBe('missing')
    expect(cloudflare.cachedUntil).toBe('2026-07-26T10:10:00.000Z')
    expect(google.state).toBe('error')
  })

  it('flags a cached stale value separately from a missing record', () => {
    const check = makeCheck({
      sources: [snapshot({ source: 'doh_google', values: ['domainify-domain-verification=old'] })],
    })
    const googlePill = deriveSourcePills(check, EXPECTED)[2]
    expect(googlePill.state).toBe('stale_value')
  })
})

describe('deriveDiagnosis', () => {
  it('returns nothing for verified or missing checks', () => {
    expect(deriveDiagnosis(baseDomain, null, EXPECTED)).toBeNull()
    expect(deriveDiagnosis(baseDomain, makeCheck({ verdict: 'verified' }), EXPECTED)).toBeNull()
  })

  it('extracts expected and found token tails for wrong_value', () => {
    const check = makeCheck({
      verdict: 'wrong_value',
      foundValues: ['"domainify-domain-verification=stale-123456"'],
    })
    const diagnosis = deriveDiagnosis(baseDomain, check, EXPECTED)
    expect(diagnosis?.expectedTail).toBe('…abcdef')
    expect(diagnosis?.foundTail).toBe('…123456')
  })

  it('explains the doubled-host mistake for misplaced_record', () => {
    const diagnosis = deriveDiagnosis(
      baseDomain,
      makeCheck({ verdict: 'misplaced_record' }),
      EXPECTED,
    )
    expect(diagnosis?.body).toContain('_domainify-challenge.example.com.example.com')
  })
})
