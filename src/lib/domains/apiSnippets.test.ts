import { describe, expect, it } from 'vitest'
import { buildCollectionOperations, buildDomainOperations } from './apiSnippets'

const DOMAIN_ID = 'dom_123'
const HTTPS_ORIGIN = 'https://domainify.example'
const HTTP_ORIGIN = 'http://localhost:3000'

describe('buildCollectionOperations', () => {
  it('covers every endpoint of the API surface', () => {
    const operations = buildCollectionOperations(HTTPS_ORIGIN)
    expect(operations.map((operation) => operation.key)).toEqual([
      'list',
      'create',
      'get',
      'verify',
      'restart',
      'regenerate',
      'delete',
    ])
  })

  it('uses placeholders so the panel never waits on a domain lookup', () => {
    const operations = buildCollectionOperations(HTTP_ORIGIN)
    const create = operations.find((operation) => operation.key === 'create')
    const get = operations.find((operation) => operation.key === 'get')
    const verify = operations.find((operation) => operation.key === 'verify')
    expect(create?.snippets.curl).toContain('{"name":"example.com"}')
    expect(create?.snippets.fetch).toContain("name: 'example.com'")
    expect(get?.path).toBe('/api/domains/<domain-id>')
    expect(verify?.snippets.curl).toContain(`${HTTP_ORIGIN}/api/domains/<domain-id>/verify`)
  })

  it('authenticates every snippet with a bearer API key', () => {
    const operations = buildCollectionOperations(HTTPS_ORIGIN)
    for (const operation of operations) {
      expect(operation.snippets.curl).toContain("-H 'Authorization: Bearer <api-key>'")
      expect(operation.snippets.fetch).toContain("authorization: 'Bearer <api-key>'")
    }
  })

  it('never mentions cookies or session internals', () => {
    const operations = buildCollectionOperations(HTTPS_ORIGIN)
    for (const operation of operations) {
      expect(operation.snippets.curl).not.toContain('cookie')
      expect(operation.snippets.curl).not.toContain('better-auth')
      expect(operation.snippets.fetch).not.toContain('better-auth')
    }
  })
})

describe('buildDomainOperations', () => {
  it('scopes every operation to the given domain id', () => {
    const operations = buildDomainOperations(HTTP_ORIGIN, DOMAIN_ID)
    expect(operations).toHaveLength(5)
    for (const operation of operations) {
      expect(operation.path).toContain(`/api/domains/${DOMAIN_ID}`)
    }
  })

  it('marks delete as returning no body in fetch snippets', () => {
    const operations = buildDomainOperations(HTTP_ORIGIN, DOMAIN_ID)
    const remove = operations.find((operation) => operation.key === 'delete')
    expect(remove?.snippets.fetch).toContain('response.status')
  })
})
