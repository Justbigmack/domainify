import { NextResponse } from 'next/server'
import { toErrorDetail } from '@/lib/domains/model/errors'

const HTTP_UNAUTHORIZED = 401
const HTTP_UNPROCESSABLE = 422

export const errorResponse = (status: number, code: string, message: string): NextResponse =>
  NextResponse.json({ error: { code, message } }, { status })

export const unauthorizedResponse = (): NextResponse =>
  errorResponse(HTTP_UNAUTHORIZED, 'unauthorized', 'Provide a valid API key or sign in.')

export const invalidBodyResponse = (message: string): NextResponse =>
  errorResponse(HTTP_UNPROCESSABLE, 'invalid_body', message)

export const serviceErrorResponse = (error: unknown): NextResponse => {
  const detail = toErrorDetail(error)
  if (!detail) throw error
  if (detail.retryAfterMs === undefined) {
    return errorResponse(detail.status, detail.code, detail.message)
  }
  return NextResponse.json(
    { error: { code: detail.code, message: detail.message }, retryAfterMs: detail.retryAfterMs },
    { status: detail.status },
  )
}
