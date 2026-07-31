import { describe, expect, it } from 'vitest'
import { buildCollectionOperations, buildDomainOperations } from './apiSnippets'

const TARGET = { id: 'dom_123', hostname: 'andreikaras.com' }
const HTTPS_ORIGIN = 'https://domainify.example'
const HTTP_ORIGIN = 'http://localhost:3000'

describe('buildCollectionOperations', () => {
  it('covers every endpoint of the API surface', () => {
    const operations = buildCollectionOperations(HTTPS_ORIGIN, TARGET)
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

  it('pre-fills snippets with the real hostname and id', () => {
    const operations = buildCollectionOperations(HTTPS_ORIGIN, TARGET)
    const create = operations.find((operation) => operation.key === 'create')
    const verify = operations.find((operation) => operation.key === 'verify')
    expect(create?.snippets.curl).toContain('{"name":"andreikaras.com"}')
    expect(create?.snippets.fetch).toContain("name: 'andreikaras.com'")
    expect(verify?.snippets.curl).toContain(`${HTTPS_ORIGIN}/api/domains/dom_123/verify`)
    expect(verify?.snippets.fetch).toContain(`'${HTTPS_ORIGIN}/api/domains/dom_123/verify'`)
  })

  it('falls back to placeholders when the user has no domains', () => {
    const operations = buildCollectionOperations(HTTP_ORIGIN, null)
    const create = operations.find((operation) => operation.key === 'create')
    const get = operations.find((operation) => operation.key === 'get')
    expect(create?.snippets.curl).toContain('example.com')
    expect(get?.path).toBe('/api/domains/<domain-id>')
  })

  it('authenticates every snippet with a bearer API key', () => {
    const operations = buildCollectionOperations(HTTPS_ORIGIN, TARGET)
    for (const operation of operations) {
      expect(operation.snippets.curl).toContain("-H 'Authorization: Bearer <api-key>'")
      expect(operation.snippets.fetch).toContain("authorization: 'Bearer <api-key>'")
    }
  })

  it('never mentions cookies or session internals', () => {
    const operations = buildCollectionOperations(HTTPS_ORIGIN, TARGET)
    for (const operation of operations) {
      expect(operation.snippets.curl).not.toContain('cookie')
      expect(operation.snippets.curl).not.toContain('better-auth')
      expect(operation.snippets.fetch).not.toContain('better-auth')
    }
  })
})

describe('buildDomainOperations', () => {
  it('scopes every operation to the given domain id', () => {
    const operations = buildDomainOperations(HTTP_ORIGIN, TARGET)
    expect(operations).toHaveLength(5)
    for (const operation of operations) {
      expect(operation.path).toContain('/api/domains/dom_123')
    }
  })

  it('marks delete as returning no body in fetch snippets', () => {
    const operations = buildDomainOperations(HTTP_ORIGIN, TARGET)
    const remove = operations.find((operation) => operation.key === 'delete')
    expect(remove?.snippets.fetch).toContain('response.status')
  })
})
