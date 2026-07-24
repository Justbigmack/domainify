import { describe, expect, it } from 'vitest'
import { parseDohTxtData } from './doh'

describe('parseDohTxtData', () => {
  it('strips surrounding quotes', () => {
    expect(parseDohTxtData('"domainify-domain-verification=abc"')).toBe(
      'domainify-domain-verification=abc',
    )
  })

  it('joins chunked character-strings without separators', () => {
    expect(parseDohTxtData('"chunk-one""chunk-two"')).toBe('chunk-onechunk-two')
  })

  it('passes through unquoted data', () => {
    expect(parseDohTxtData('plain-value')).toBe('plain-value')
  })
})
