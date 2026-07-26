import { describe, expect, it } from 'vitest'
import { isUniqueViolation } from './errors'

const uniqueViolation = () => Object.assign(new Error('duplicate key value'), { code: '23505' })

describe('isUniqueViolation', () => {
  it('detects a driver error carrying the unique-violation code', () => {
    expect(isUniqueViolation(uniqueViolation())).toBe(true)
  })

  it('detects the code on a wrapped error cause, as drizzle throws it', () => {
    const wrapped = new Error('Failed query: insert into "domains" ...', {
      cause: uniqueViolation(),
    })
    expect(isUniqueViolation(wrapped)).toBe(true)
  })

  it('detects the code through nested causes', () => {
    const inner = new Error('transport failure', { cause: uniqueViolation() })
    expect(isUniqueViolation(new Error('Failed query', { cause: inner }))).toBe(true)
  })

  it('rejects errors with other codes or no code', () => {
    expect(isUniqueViolation(Object.assign(new Error('boom'), { code: '23503' }))).toBe(false)
    expect(isUniqueViolation(new Error('boom'))).toBe(false)
  })

  it('rejects non-error values', () => {
    expect(isUniqueViolation(null)).toBe(false)
    expect(isUniqueViolation('23505')).toBe(false)
  })
})
