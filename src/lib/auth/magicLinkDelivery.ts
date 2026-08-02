import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { user } from '@/db/authSchema'
import { sendMagicLinkEmail } from '@/lib/emails/sendMagicLink'

export const MAGIC_LINK_RESPONSE_FLOOR_MS = 900

type DeliverMagicLinkInput = {
  email: string
  magicLinkUrl: string
}

const wait = (durationMs: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, durationMs))

const sendToExistingUser = async ({ email, magicLinkUrl }: DeliverMagicLinkInput): Promise<void> => {
  const [existingUser] = await db
    .select({ email: user.email })
    .from(user)
    .where(eq(user.email, email.trim().toLowerCase()))
    .limit(1)
  if (!existingUser) return
  await sendMagicLinkEmail({ recipientEmail: existingUser.email, magicLinkUrl })
}

export const deliverMagicLinkToExistingUser = async (
  input: DeliverMagicLinkInput,
): Promise<void> => {
  const startedAt = Date.now()
  try {
    await sendToExistingUser(input)
  } catch (error) {
    console.error('Magic link delivery failed', error)
  }
  await wait(Math.max(0, MAGIC_LINK_RESPONSE_FLOOR_MS - (Date.now() - startedAt)))
}
