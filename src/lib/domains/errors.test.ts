import { describe, expect, it } from 'vitest'
import {
  DomainInputInvalidError,
  DomainNotFoundError,
  DomainStateError,
  DuplicateDomainError,
  VerifyCooldownError,
  isUniqueViolation,
  toErrorDetail,
} from './errors'

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

describe('toErrorDetail', () => {
  it('maps DomainNotFoundError', () => {
    expect(toErrorDetail(new DomainNotFoundError())).toEqual({
      status: 404,
      code: 'not_found',
      message: 'Domain not found',
    })
  })

  it('maps DomainInputInvalidError', () => {
    const detail = toErrorDetail(
      new DomainInputInvalidError({ code: 'invalid_hostname', message: 'Enter a valid domain.' }),
    )
    expect(detail).toEqual({
      status: 422,
      code: 'invalid_hostname',
      message: 'Enter a valid domain.',
    })
  })

  it('maps DuplicateDomainError', () => {
    const detail = toErrorDetail(new DuplicateDomainError('app.example.com'))
    expect(detail?.status).toBe(409)
    expect(detail?.code).toBe('duplicate')
    expect(detail?.message).toContain('app.example.com')
  })

  it('maps DomainStateError', () => {
    expect(toErrorDetail(new DomainStateError('nope'))).toEqual({
      status: 409,
      code: 'invalid_state',
      message: 'nope',
    })
  })

  it('maps VerifyCooldownError', () => {
    const detail = toErrorDetail(new VerifyCooldownError(3200))
    expect(detail?.status).toBe(429)
    expect(detail?.code).toBe('cooldown')
    expect(detail?.retryAfterMs).toBe(3200)
  })

  it('returns null for unmapped errors and non-error input', () => {
    expect(toErrorDetail(new Error('boom'))).toBeNull()
    expect(toErrorDetail(null)).toBeNull()
  })
})
