import { apiKey } from '@better-auth/api-key'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { nextCookies } from 'better-auth/next-js'
import { magicLink } from 'better-auth/plugins/magic-link'
import { multiSession } from 'better-auth/plugins/multi-session'
import { db } from '@/db'
import {
  API_KEY_PREFIX,
  EMAIL_VERIFICATION_TOKEN_TTL_SECONDS,
  PASSWORD_MIN_LENGTH,
  SESSION_COOKIE_CACHE_MAX_AGE_SECONDS,
} from '@/lib/auth/model/policy'
import { deliverEmailVerification } from '@/lib/auth/server/emailVerification'
import { deliverMagicLinkToExistingUser } from '@/lib/auth/server/magicLinkDelivery'
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
    requireEmailVerification: true,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      await sendResetPasswordEmail({ recipientEmail: user.email, resetUrl: url })
    },
  },
  emailVerification: {
    expiresIn: EMAIL_VERIFICATION_TOKEN_TTL_SECONDS,
    sendOnSignUp: true,
    sendOnSignIn: true,
    sendVerificationEmail: async ({ user, url }) => {
      await deliverEmailVerification({ recipientEmail: user.email, verificationUrl: url })
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
      disableSignUp: true,
      sendMagicLink: async ({ email, url }) => {
        await deliverMagicLinkToExistingUser({ email, magicLinkUrl: url })
      },
    }),
    multiSession(),
    nextCookies(),
  ],
})
