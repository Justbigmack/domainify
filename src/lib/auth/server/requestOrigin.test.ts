import { describe, expect, it } from 'vitest'
import { isSameOriginRequest } from './requestOrigin'

const APP_HOST = 'domainify.test'

const headersFor = (entries: Record<string, string>): Headers => new Headers(entries)

describe('isSameOriginRequest', () => {
  it('trusts a fetch the app makes to itself', () => {
    expect(
      isSameOriginRequest(
        headersFor({ 'sec-fetch-site': 'same-origin', origin: `https://${APP_HOST}`, host: APP_HOST }),
      ),
    ).toBe(true)
  })

  it('trusts a user typing the endpoint into the address bar', () => {
    expect(isSameOriginRequest(headersFor({ 'sec-fetch-site': 'none', host: APP_HOST }))).toBe(true)
  })

  it.each(['cross-site', 'same-site'])('rejects a %s request', (fetchSite) => {
    expect(
      isSameOriginRequest(
        headersFor({ 'sec-fetch-site': fetchSite, origin: 'https://evil.test', host: APP_HOST }),
      ),
    ).toBe(false)
  })

  it('trusts a non-browser client that sends neither header', () => {
    expect(isSameOriginRequest(headersFor({ host: APP_HOST }))).toBe(true)
  })

  it('falls back to the origin header when sec-fetch-site is absent', () => {
    expect(
      isSameOriginRequest(headersFor({ origin: `https://${APP_HOST}`, host: APP_HOST })),
    ).toBe(true)
    expect(isSameOriginRequest(headersFor({ origin: 'https://evil.test', host: APP_HOST }))).toBe(
      false,
    )
  })

  it('compares against the forwarded host the platform reports', () => {
    expect(
      isSameOriginRequest(
        headersFor({
          origin: `https://${APP_HOST}`,
          'x-forwarded-host': APP_HOST,
          host: 'internal-deployment.vercel.app',
        }),
      ),
    ).toBe(true)
  })

  it('rejects an unparseable origin and a request with no host to compare', () => {
    expect(isSameOriginRequest(headersFor({ origin: 'not a url', host: APP_HOST }))).toBe(false)
    expect(isSameOriginRequest(headersFor({ origin: `https://${APP_HOST}` }))).toBe(false)
  })
})
