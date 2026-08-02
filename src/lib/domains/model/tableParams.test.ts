import { describe, expect, it } from 'vitest'
import {
  DEFAULT_DOMAINS_TABLE_PARAMS,
  parseDomainsTableParams,
  serializeDomainsTableParams,
} from './tableParams'

const parse = (query: string) => parseDomainsTableParams(new URLSearchParams(query))

describe('parseDomainsTableParams', () => {
  it('falls back to defaults when the query string is empty', () => {
    expect(parse('')).toEqual(DEFAULT_DOMAINS_TABLE_PARAMS)
  })

  it('reads every supported param', () => {
    expect(parse('q=example&status=pending&sort=created&dir=asc')).toEqual({
      searchQuery: 'example',
      statusFilter: 'pending',
      sortColumn: 'created',
      sortDirection: 'asc',
    })
  })

  it('ignores an unknown status', () => {
    expect(parse('status=not-a-status').statusFilter).toBe('all')
  })

  it('ignores an unknown sort column', () => {
    expect(parse('sort=passwords&dir=asc').sortColumn).toBeNull()
  })

  it('falls back to the column default when the direction is unknown', () => {
    expect(parse('sort=created&dir=sideways').sortDirection).toBe('desc')
    expect(parse('sort=domain&dir=sideways').sortDirection).toBe('asc')
  })

  it('keeps a direction that arrives without a column out of the sort', () => {
    expect(parse('dir=desc')).toEqual({ ...DEFAULT_DOMAINS_TABLE_PARAMS, sortDirection: 'desc' })
  })

  it('preserves a search query that looks like a domain', () => {
    expect(parse('q=sub.example.co.uk').searchQuery).toBe('sub.example.co.uk')
  })
})

describe('serializeDomainsTableParams', () => {
  it('omits every param that still holds its default', () => {
    expect(serializeDomainsTableParams(DEFAULT_DOMAINS_TABLE_PARAMS)).toBe('')
  })

  it('writes the search query trimmed', () => {
    expect(
      serializeDomainsTableParams({ ...DEFAULT_DOMAINS_TABLE_PARAMS, searchQuery: '  example  ' }),
    ).toBe('q=example')
  })

  it('omits a search query that is only whitespace', () => {
    expect(
      serializeDomainsTableParams({ ...DEFAULT_DOMAINS_TABLE_PARAMS, searchQuery: '   ' }),
    ).toBe('')
  })

  it('writes the direction alongside the column, never alone', () => {
    expect(
      serializeDomainsTableParams({
        ...DEFAULT_DOMAINS_TABLE_PARAMS,
        sortDirection: 'desc',
      }),
    ).toBe('')
    expect(
      serializeDomainsTableParams({
        ...DEFAULT_DOMAINS_TABLE_PARAMS,
        sortColumn: 'lastChecked',
        sortDirection: 'desc',
      }),
    ).toBe('sort=lastChecked&dir=desc')
  })

  it('round-trips a fully populated state', () => {
    const params = {
      searchQuery: 'example.com',
      statusFilter: 'temporary_failure',
      sortColumn: 'status',
      sortDirection: 'desc',
    } as const
    expect(parse(serializeDomainsTableParams(params))).toEqual(params)
  })
})
