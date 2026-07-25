import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { nextCookies } from 'better-auth/next-js'
import { magicLink } from 'better-auth/plugins'
import { db } from '@/db'
import { sendMagicLinkEmail } from '@/lib/emails/send-magic-link'

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg' }),
  plugins: [
    magicLink({
      storeToken: 'hashed',
      sendMagicLink: async ({ email, url }) => {
        await sendMagicLinkEmail({ recipientEmail: email, magicLinkUrl: url })
      },
    }),
    nextCookies(),
  ],
})
