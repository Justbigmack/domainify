import { Resend } from 'resend'
import { EmailVerificationEmail } from './EmailVerificationEmail'

const DEFAULT_FROM_ADDRESS = 'domainify <onboarding@resend.dev>'

const buildPlainTextBody = (verifyUrl: string): string =>
  [
    'Verify your email address',
    '',
    'Click the link below to confirm this address and finish creating your domainify account. This link expires in one hour.',
    '',
    verifyUrl,
    '',
    'If you did not create a domainify account, you can safely ignore this email. No account can be used until this address is confirmed.',
  ].join('\n')

type SendEmailVerificationInput = {
  recipientEmail: string
  verifyUrl: string
}

export const sendEmailVerificationEmail = async ({
  recipientEmail,
  verifyUrl,
}: SendEmailVerificationInput): Promise<void> => {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM ?? DEFAULT_FROM_ADDRESS,
    to: recipientEmail,
    subject: 'Verify your email address',
    react: EmailVerificationEmail({ verifyUrl }),
    text: buildPlainTextBody(verifyUrl),
  })
  if (error) {
    throw new Error(`Failed to send email verification email: ${error.message}`)
  }
}
