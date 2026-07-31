import { NextResponse } from 'next/server'
import {
  DomainInputInvalidError,
  DomainNotFoundError,
  DomainStateError,
  DuplicateDomainError,
  VerifyCooldownError,
} from '@/lib/domains/errors'

const HTTP_UNAUTHORIZED = 401
const HTTP_NOT_FOUND = 404
const HTTP_CONFLICT = 409
const HTTP_UNPROCESSABLE = 422
const HTTP_TOO_MANY_REQUESTS = 429

export const errorResponse = (status: number, code: string, message: string): NextResponse =>
  NextResponse.json({ error: { code, message } }, { status })

export const unauthorizedResponse = (): NextResponse =>
  errorResponse(HTTP_UNAUTHORIZED, 'unauthorized', 'Provide a valid API key or sign in.')

export const invalidBodyResponse = (message: string): NextResponse =>
  errorResponse(HTTP_UNPROCESSABLE, 'invalid_body', message)

export const serviceErrorResponse = (error: unknown): NextResponse => {
  if (error instanceof DomainNotFoundError) {
    return errorResponse(HTTP_NOT_FOUND, 'not_found', error.message)
  }
  if (error instanceof DomainInputInvalidError) {
    return errorResponse(HTTP_UNPROCESSABLE, error.detail.code, error.detail.message)
  }
  if (error instanceof DuplicateDomainError) {
    return errorResponse(HTTP_CONFLICT, 'duplicate', error.message)
  }
  if (error instanceof DomainStateError) {
    return errorResponse(HTTP_CONFLICT, 'invalid_state', error.message)
  }
  if (error instanceof VerifyCooldownError) {
    return NextResponse.json(
      { error: { code: 'cooldown', message: error.message }, retryAfterMs: error.retryAfterMs },
      { status: HTTP_TOO_MANY_REQUESTS },
    )
  }
  throw error
}
