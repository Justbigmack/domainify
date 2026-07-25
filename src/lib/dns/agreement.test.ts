import { describe, expect, it } from 'vitest'
import { buildExpectedRecordValue, isAuthoritativeAgreementReached } from './check'
import type { TxtLookup } from './types'

const expectedValue = buildExpectedRecordValue('abc123')

const matching: TxtLookup = { kind: 'records', values: [expectedValue], minTtlSeconds: null }
const empty: TxtLookup = { kind: 'no_records' }
const errored: TxtLookup = { kind: 'lookup_error', code: 'ETIMEOUT' }

describe('isAuthoritativeAgreementReached', () => {
  it('passes when every queried nameserver returns the token', () => {
    expect(isAuthoritativeAgreementReached([matching, matching], expectedValue)).toBe(true)
  })

  it('fails when nameservers disagree', () => {
    expect(isAuthoritativeAgreementReached([matching, empty], expectedValue)).toBe(false)
  })

  it('accepts a single answer when the other nameserver errored', () => {
    expect(isAuthoritativeAgreementReached([matching, errored], expectedValue)).toBe(true)
  })

  it('fails when every lookup errored', () => {
    expect(isAuthoritativeAgreementReached([errored, errored], expectedValue)).toBe(false)
  })

  it('fails with no lookups at all', () => {
    expect(isAuthoritativeAgreementReached([], expectedValue)).toBe(false)
  })
})
