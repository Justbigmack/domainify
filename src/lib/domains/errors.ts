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
