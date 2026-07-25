import { describe, expect, it } from 'vitest'
import { parseDohTxtData } from './doh'

describe('parseDohTxtData', () => {
  it('strips surrounding quotes', () => {
    expect(parseDohTxtData('"domainify-domain-verification=abc"')).toBe(
      'domainify-domain-verification=abc',
    )
  })

  it('joins adjacent quoted chunks without separators', () => {
    expect(parseDohTxtData('"chunk-one""chunk-two"')).toBe('chunk-onechunk-two')
  })

  it('joins space-separated quoted chunks as Cloudflare returns them', () => {
    expect(parseDohTxtData('"chunk-one" "chunk-two"')).toBe('chunk-onechunk-two')
  })

  it('passes through unquoted data as Google returns it', () => {
    expect(parseDohTxtData('plain-concatenated-value')).toBe('plain-concatenated-value')
  })
})
