import { describe, expect, it } from 'vitest'
import { challengeRecordName, normalizeDomainInput } from './normalize'

const expectError = (input: string, code: string) => {
  const result = normalizeDomainInput(input)
  expect(result.ok).toBe(false)
  if (!result.ok) {
    expect(result.error.code).toBe(code)
  }
}

describe('normalizeDomainInput', () => {
  it('extracts the hostname from a full URL', () => {
    const result = normalizeDomainInput('https://www.example.com/path?q=1')
    expect(result).toMatchObject({
      ok: true,
      domain: {
        hostname: 'www.example.com',
        registrableDomain: 'example.com',
        isApex: false,
        challengeHost: '_domainify-challenge.www.example.com',
      },
    })
  })

  it('lowercases and strips a trailing dot', () => {
    const result = normalizeDomainInput('Example.COM.')
    expect(result).toMatchObject({
      ok: true,
      domain: { hostname: 'example.com', isApex: true },
    })
  })

  it('converts internationalized names to punycode', () => {
    const result = normalizeDomainInput('bücher.de')
    expect(result).toMatchObject({
      ok: true,
      domain: { hostname: 'xn--bcher-kva.de' },
    })
  })

  it('treats a subdomain as non-apex with the parent registrable domain', () => {
    const result = normalizeDomainInput('app.staging.example.co.uk')
    expect(result).toMatchObject({
      ok: true,
      domain: { registrableDomain: 'example.co.uk', isApex: false },
    })
  })

  it('rejects empty input', () => {
    expectError('   ', 'empty')
  })

  it('rejects input that cannot be parsed as a hostname', () => {
    expectError('not a domain', 'unparseable')
  })

  it('rejects IP addresses', () => {
    expectError('192.168.1.1', 'ip_address')
  })

  it('rejects public suffixes', () => {
    expectError('co.uk', 'public_suffix')
  })

  it('rejects platform-owned suffixes and their subdomains', () => {
    expectError('vercel.app', 'platform_suffix')
    expectError('my-site.vercel.app', 'platform_suffix')
  })

  it('rejects labels with invalid characters', () => {
    expectError('exa_mple.com', 'invalid_hostname')
  })

  it('rejects punctuation-riddled input as invalid instead of calling it a public suffix', () => {
    expectError('mycustomdomain.whateverdomain.,.,.com', 'invalid_hostname')
  })
})

describe('challengeRecordName', () => {
  it('returns the bare label for an apex domain', () => {
    expect(challengeRecordName('_domainify-challenge.example.com', 'example.com')).toBe(
      '_domainify-challenge',
    )
  })

  it('keeps the subdomain labels for a non-apex domain', () => {
    expect(challengeRecordName('_domainify-challenge.whatever.example.com', 'example.com')).toBe(
      '_domainify-challenge.whatever',
    )
  })

  it('keeps deep subdomain labels intact', () => {
    expect(
      challengeRecordName('_domainify-challenge.app.staging.example.co.uk', 'example.co.uk'),
    ).toBe('_domainify-challenge.app.staging')
  })
})
