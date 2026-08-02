import { describe, expect, it } from 'vitest'
import { resolveVerificationNotice } from './verificationNotice'

describe('resolveVerificationNotice', () => {
  it('shows nothing on a plain visit to the sign-in page', () => {
    expect(resolveVerificationNotice({})).toBeNull()
  })

  it('ignores a stray error param when the verification callback was never involved', () => {
    expect(resolveVerificationNotice({ error: 'TOKEN_EXPIRED' })).toBeNull()
  })

  it('confirms the address when the callback returned without an error', () => {
    expect(resolveVerificationNotice({ verified: '1' })).toEqual({
      tone: 'success',
      message: 'Your email is verified. Sign in to continue.',
    })
  })

  it('names expiry specifically, because signing in sends a fresh link', () => {
    expect(resolveVerificationNotice({ verified: '1', error: 'TOKEN_EXPIRED' })).toEqual({
      tone: 'error',
      message: 'That verification link expired. Sign in and we’ll email you a new one.',
    })
  })

  it.each([['INVALID_TOKEN'], ['USER_NOT_FOUND'], ['INVALID_USER'], ['SOMETHING_NEW']])(
    'collapses %s into one generic failure rather than leaking the reason',
    (errorCode) => {
      expect(resolveVerificationNotice({ verified: '1', error: errorCode })).toEqual({
        tone: 'error',
        message:
          'That verification link is no longer valid. Sign in and we’ll email you a new one.',
      })
    },
  )
})
