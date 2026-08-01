import type { DomainInputError } from '@/lib/dns/normalize'

export class DomainNotFoundError extends Error {
  constructor() {
    super('Domain not found')
  }
}

export class DomainInputInvalidError extends Error {
  readonly detail: DomainInputError

  constructor(detail: DomainInputError) {
    super(detail.message)
    this.detail = detail
  }
}

export class DuplicateDomainError extends Error {
  constructor(hostname: string) {
    super(`You've already added ${hostname}.`)
  }
}

export class VerifyCooldownError extends Error {
  readonly retryAfterMs: number

  constructor(retryAfterMs: number) {
    super('Please wait a moment before checking again.')
    this.retryAfterMs = retryAfterMs
  }
}

export class DomainStateError extends Error {}

const HTTP_NOT_FOUND = 404
const HTTP_CONFLICT = 409
const HTTP_UNPROCESSABLE = 422
const HTTP_TOO_MANY_REQUESTS = 429

export type ServiceErrorDetail = {
  status: number
  code: string
  message: string
  retryAfterMs?: number
}

export const toErrorDetail = (error: unknown): ServiceErrorDetail | null => {
  if (error instanceof DomainNotFoundError) {
    return { status: HTTP_NOT_FOUND, code: 'not_found', message: error.message }
  }
  if (error instanceof DomainInputInvalidError) {
    return { status: HTTP_UNPROCESSABLE, code: error.detail.code, message: error.detail.message }
  }
  if (error instanceof DuplicateDomainError) {
    return { status: HTTP_CONFLICT, code: 'duplicate', message: error.message }
  }
  if (error instanceof DomainStateError) {
    return { status: HTTP_CONFLICT, code: 'invalid_state', message: error.message }
  }
  if (error instanceof VerifyCooldownError) {
    return {
      status: HTTP_TOO_MANY_REQUESTS,
      code: 'cooldown',
      message: error.message,
      retryAfterMs: error.retryAfterMs,
    }
  }
  return null
}

const UNIQUE_VIOLATION_CODE = '23505'

export const isUniqueViolation = (error: unknown): boolean => {
  if (!(error instanceof Error)) return false
  if ('code' in error && error.code === UNIQUE_VIOLATION_CODE) return true
  return isUniqueViolation(error.cause)
}
