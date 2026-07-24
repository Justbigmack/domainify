import { Resend } from 'resend'
import { MagicLinkEmail } from './magic-link-email'

const DEFAULT_FROM_ADDRESS = 'Domainify <onboarding@resend.dev>'

type SendMagicLinkInput = {
  recipientEmail: string
  magicLinkUrl: string
}

export const sendMagicLinkEmail = async ({
  recipientEmail,
  magicLinkUrl,
}: SendMagicLinkInput): Promise<void> => {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM ?? DEFAULT_FROM_ADDRESS,
    to: recipientEmail,
    subject: 'Sign in to Domainify',
    react: MagicLinkEmail({ magicLinkUrl }),
  })
  if (error) {
    throw new Error(`Failed to send magic link email: ${error.message}`)
  }
}
