import { describe, expect, it } from 'vitest'
import { buildExpectedRecordValue, containsExpectedValue } from './check'

const token = 'abc123'
const expectedValue = buildExpectedRecordValue(token)

describe('buildExpectedRecordValue', () => {
  it('prefixes the token with the product identifier', () => {
    expect(expectedValue).toBe('domainify-domain-verification=abc123')
  })
})

describe('containsExpectedValue', () => {
  it('matches an exact record among unrelated ones', () => {
    const values = ['v=spf1 -all', expectedValue]
    expect(containsExpectedValue(values, expectedValue)).toBe(true)
  })

  it('matches a record wrapped in pasted quotes', () => {
    expect(containsExpectedValue([`"${expectedValue}"`], expectedValue)).toBe(true)
  })

  it('matches a record with surrounding whitespace', () => {
    expect(containsExpectedValue([`  ${expectedValue}  `], expectedValue)).toBe(true)
  })

  it('rejects a record with a different token', () => {
    expect(containsExpectedValue(['domainify-domain-verification=other'], expectedValue)).toBe(
      false,
    )
  })

  it('rejects when no records are present', () => {
    expect(containsExpectedValue([], expectedValue)).toBe(false)
  })
})
