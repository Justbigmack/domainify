import { beforeEach, describe, expect, it, vi } from 'vitest'

const sendEmailVerificationEmail = vi.hoisted(() => vi.fn(() => Promise.resolve()))

vi.mock('@/lib/emails/sendEmailVerification', () => ({ sendEmailVerificationEmail }))

import { EMAIL_VERIFIED_CALLBACK_PATH } from '@/lib/auth/model/policy'
import { buildVerificationUrl, deliverEmailVerification } from './emailVerification'

const BASE_URL = 'https://domainify.test/api/auth/verify-email'
const TOKEN = 'jwt.token.value'

const callbackOf = (verificationUrl: string): string | null =>
  new URL(verificationUrl).searchParams.get('callbackURL')

describe('buildVerificationUrl', () => {
  it('points the callback at the sign-in page regardless of what Better Auth suggested', () => {
    const rewritten = buildVerificationUrl(`${BASE_URL}?token=${TOKEN}&callbackURL=%2F`)

    expect(callbackOf(rewritten)).toBe(EMAIL_VERIFIED_CALLBACK_PATH)
  })

  it('adds the callback when the incoming link carries none', () => {
    const rewritten = buildVerificationUrl(`${BASE_URL}?token=${TOKEN}`)

    expect(callbackOf(rewritten)).toBe(EMAIL_VERIFIED_CALLBACK_PATH)
  })

  it('leaves the verification token untouched', () => {
    const rewritten = buildVerificationUrl(`${BASE_URL}?token=${TOKEN}&callbackURL=%2Fdomains`)

    expect(new URL(rewritten).searchParams.get('token')).toBe(TOKEN)
  })

  it('keeps the origin and path Better Auth built from its own base URL', () => {
    const rewritten = new URL(buildVerificationUrl(`${BASE_URL}?token=${TOKEN}`))

    expect(rewritten.origin).toBe('https://domainify.test')
    expect(rewritten.pathname).toBe('/api/auth/verify-email')
  })
})

describe('deliverEmailVerification', () => {
  beforeEach(() => {
    sendEmailVerificationEmail.mockClear()
    sendEmailVerificationEmail.mockImplementation(() => Promise.resolve())
  })

  it('sends the rewritten link to the recipient', async () => {
    await deliverEmailVerification({
      recipientEmail: 'owner@example.com',
      verificationUrl: `${BASE_URL}?token=${TOKEN}&callbackURL=%2F`,
    })

    expect(sendEmailVerificationEmail).toHaveBeenCalledWith({
      recipientEmail: 'owner@example.com',
      verifyUrl: buildVerificationUrl(`${BASE_URL}?token=${TOKEN}&callbackURL=%2F`),
    })
  })

  it('surfaces provider failures so Better Auth can log them', async () => {
    sendEmailVerificationEmail.mockImplementation(() => Promise.reject(new Error('resend is down')))

    await expect(
      deliverEmailVerification({
        recipientEmail: 'owner@example.com',
        verificationUrl: `${BASE_URL}?token=${TOKEN}`,
      }),
    ).rejects.toThrow('resend is down')
  })
})
