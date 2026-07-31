import { apiKey } from '@better-auth/api-key'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { nextCookies } from 'better-auth/next-js'
import { magicLink } from 'better-auth/plugins/magic-link'
import { multiSession } from 'better-auth/plugins/multi-session'
import { db } from '@/db'
import {
  API_KEY_PREFIX,
  PASSWORD_MIN_LENGTH,
  SESSION_COOKIE_CACHE_MAX_AGE_SECONDS,
} from '@/lib/authPolicy'
import { sendMagicLinkEmail } from '@/lib/emails/sendMagicLink'
import { sendResetPasswordEmail } from '@/lib/emails/sendResetPassword'

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg' }),
  rateLimit: {
    storage: 'database',
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: SESSION_COOKIE_CACHE_MAX_AGE_SECONDS,
    },
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: PASSWORD_MIN_LENGTH,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      await sendResetPasswordEmail({ recipientEmail: user.email, resetUrl: url })
    },
  },
  plugins: [
    apiKey({
      defaultPrefix: API_KEY_PREFIX,
      startingCharactersConfig: { shouldStore: true, charactersLength: 14 },
      rateLimit: { enabled: false },
    }),
    magicLink({
      storeToken: 'hashed',
      sendMagicLink: async ({ email, url }) => {
        await sendMagicLinkEmail({ recipientEmail: email, magicLinkUrl: url })
      },
    }),
    multiSession(),
    nextCookies(),
  ],
})
