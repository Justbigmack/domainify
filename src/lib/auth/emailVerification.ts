import { EMAIL_VERIFIED_CALLBACK_PATH } from '@/lib/auth/policy'
import { sendEmailVerificationEmail } from '@/lib/emails/sendEmailVerification'

const CALLBACK_URL_PARAM = 'callbackURL'

export const buildVerificationUrl = (verificationUrl: string): string => {
  const url = new URL(verificationUrl)
  url.searchParams.set(CALLBACK_URL_PARAM, EMAIL_VERIFIED_CALLBACK_PATH)
  return url.toString()
}

type DeliverEmailVerificationInput = {
  recipientEmail: string
  verificationUrl: string
}

export const deliverEmailVerification = async ({
  recipientEmail,
  verificationUrl,
}: DeliverEmailVerificationInput): Promise<void> => {
  await sendEmailVerificationEmail({
    recipientEmail,
    verifyUrl: buildVerificationUrl(verificationUrl),
  })
}
