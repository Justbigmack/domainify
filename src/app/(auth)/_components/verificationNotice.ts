export type VerificationNotice = {
  tone: 'success' | 'error'
  message: string
}

type ResolveVerificationNoticeInput = {
  verified?: string
  error?: string
}

const VERIFIED_MESSAGE = 'Your email is verified. Sign in to continue.'
const EXPIRED_MESSAGE = 'That verification link expired. Sign in and we’ll email you a new one.'
const INVALID_MESSAGE = 'That verification link is no longer valid. Sign in and we’ll email you a new one.'

export const resolveVerificationNotice = ({
  verified,
  error,
}: ResolveVerificationNoticeInput): VerificationNotice | null => {
  if (verified === undefined) return null
  if (error === undefined) return { tone: 'success', message: VERIFIED_MESSAGE }
  if (error === 'TOKEN_EXPIRED') return { tone: 'error', message: EXPIRED_MESSAGE }
  return { tone: 'error', message: INVALID_MESSAGE }
}
