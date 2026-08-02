import { describe, expect, it } from 'vitest'
import { makeDomain } from '@/lib/domains/domainFixture'
import { toApiCheck, toApiDomain } from './domainPayload'

describe('toApiDomain', () => {
  it('never exposes the owner id, the raw token, or internal cooldown bookkeeping', () => {
    const payload = toApiDomain(makeDomain({ verificationToken: 'secret-token' }))

    expect(payload).not.toHaveProperty('userId')
    expect(payload).not.toHaveProperty('verificationToken')
    expect(payload).not.toHaveProperty('tokenGeneratedAt')
    expect(payload).not.toHaveProperty('lastManualCheckAt')
    expect(JSON.stringify(payload)).not.toContain('secret-token')
  })

  it('serializes every timestamp as an ISO string and keeps nulls null', () => {
    const payload = toApiDomain(
      makeDomain({ verifiedAt: new Date('2026-08-02T09:00:00.000Z'), nextCheckAt: null }),
    )

    expect(payload.verifiedAt).toBe('2026-08-02T09:00:00.000Z')
    expect(payload.createdAt).toBe(new Date(payload.createdAt).toISOString())
    expect(payload.nextCheckAt).toBeNull()
    expect(payload.graceExpiresAt).toBeNull()
  })

  it('carries the fields a client needs to publish and track the record', () => {
    const payload = toApiDomain(makeDomain({ status: 'verified', dnsProviderId: 'cloudflare' }))

    expect(payload).toMatchObject({
      id: 'domain-1',
      hostname: 'example.com',
      registrableDomain: 'example.com',
      challengeHost: '_domainify-challenge.example.com',
      status: 'verified',
      dnsProviderId: 'cloudflare',
    })
  })
})

describe('toApiCheck', () => {
  it('serializes the check row without dropping its diagnostic detail', () => {
    const checkedAt = new Date('2026-08-02T09:41:07.000Z')

    const payload = toApiCheck({
      id: 'check-1',
      domainId: 'domain-1',
      checkedAt,
      trigger: 'manual',
      verdict: 'no_record',
      foundValues: ['other-value'],
      sources: [
        {
          source: 'authoritative',
          kind: 'no_records',
          values: [],
          minTtlSeconds: null,
          errorCode: null,
        },
      ],
      errorCode: null,
    })

    expect(payload.checkedAt).toBe('2026-08-02T09:41:07.000Z')
    expect(payload.verdict).toBe('no_record')
    expect(payload.foundValues).toEqual(['other-value'])
    expect(payload.sources).toHaveLength(1)
  })
})
