import { describe, expect, it } from 'vitest'
import type { CheckSourceSnapshot } from '@/lib/dns/types'
import { deriveDiagnosis, deriveSourcePills } from './insights'
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
  it('returns nothing for verified, missing, or no_record checks', () => {
    expect(deriveDiagnosis(baseDomain, null, EXPECTED)).toBeNull()
    expect(deriveDiagnosis(baseDomain, makeCheck({ verdict: 'verified' }), EXPECTED)).toBeNull()
    expect(deriveDiagnosis(baseDomain, makeCheck({ verdict: 'no_record' }), EXPECTED)).toBeNull()
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
    expect(diagnosis?.body).toContain('Host field to just _domainify-challenge.')
  })

  it('doubles against the zone and keeps subdomain labels in the suggested host for misplaced_record', () => {
    const subdomain: DomainView = {
      ...baseDomain,
      hostname: 'whatever.example.com',
      challengeHost: '_domainify-challenge.whatever.example.com',
    }
    const diagnosis = deriveDiagnosis(
      subdomain,
      makeCheck({ verdict: 'misplaced_record' }),
      EXPECTED,
    )
    expect(diagnosis?.body).toContain('_domainify-challenge.whatever.example.com.example.com')
    expect(diagnosis?.body).toContain('Host field to just _domainify-challenge.whatever.')
  })
})
