import { Resend } from 'resend'
import { ResetPasswordEmail } from './ResetPasswordEmail'

const DEFAULT_FROM_ADDRESS = 'Domainify <onboarding@resend.dev>'

const buildPlainTextBody = (resetUrl: string): string =>
  [
    'Reset your Domainify password',
    '',
    'Click the link below to choose a new password. This link expires in one hour and can only be used once.',
    '',
    resetUrl,
    '',
    'If you did not request a password reset, you can safely ignore this email. Your password will not change.',
  ].join('\n')

type SendResetPasswordInput = {
  recipientEmail: string
  resetUrl: string
}

export const sendResetPasswordEmail = async ({
  recipientEmail,
  resetUrl,
}: SendResetPasswordInput): Promise<void> => {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM ?? DEFAULT_FROM_ADDRESS,
    to: recipientEmail,
    subject: 'Reset your Domainify password',
    react: ResetPasswordEmail({ resetUrl }),
    text: buildPlainTextBody(resetUrl),
  })
  if (error) {
    throw new Error(`Failed to send reset password email: ${error.message}`)
  }
}
