import type { ReactElement } from 'react'
import { Resend } from 'resend'
import { DomainVerifiedEmail } from './DomainVerifiedEmail'
import { GraceWarningEmail } from './GraceWarningEmail'

const DEFAULT_FROM_ADDRESS = 'domainify <onboarding@resend.dev>'
const DEFAULT_APP_URL = 'http://localhost:3000'

const appBaseUrl = (): string => process.env.BETTER_AUTH_URL ?? DEFAULT_APP_URL

const domainDashboardUrl = (): string => `${appBaseUrl()}/domains`

const deadlineFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'long',
  timeStyle: 'short',
  timeZone: 'UTC',
})

const formatDeadline = (deadline: Date | null): string =>
  deadline === null ? 'the grace period ends' : `${deadlineFormatter.format(deadline)} UTC`

type SendDomainEmailInput = {
  recipientEmail: string
  subject: string
  body: ReactElement
}

const sendDomainEmail = async ({
  recipientEmail,
  subject,
  body,
}: SendDomainEmailInput): Promise<void> => {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM ?? DEFAULT_FROM_ADDRESS,
    to: recipientEmail,
    subject,
    react: body,
  })
  if (error) {
    throw new Error(`Failed to send "${subject}" email: ${error.message}`)
  }
}

type DomainVerifiedInput = {
  recipientEmail: string
  hostname: string
}

export const sendDomainVerifiedEmail = async ({
  recipientEmail,
  hostname,
}: DomainVerifiedInput): Promise<void> =>
  sendDomainEmail({
    recipientEmail,
    subject: `${hostname} is verified`,
    body: DomainVerifiedEmail({ hostname, dashboardUrl: domainDashboardUrl() }),
  })

type GraceWarningInput = {
  recipientEmail: string
  hostname: string
  graceExpiresAt: Date | null
}

export const sendGraceWarningEmail = async ({
  recipientEmail,
  hostname,
  graceExpiresAt,
}: GraceWarningInput): Promise<void> =>
  sendDomainEmail({
    recipientEmail,
    subject: `Action needed: verification record missing for ${hostname}`,
    body: GraceWarningEmail({
      hostname,
      deadlineText: formatDeadline(graceExpiresAt),
      dashboardUrl: domainDashboardUrl(),
    }),
  })
