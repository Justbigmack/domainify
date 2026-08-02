import { randomBytes } from 'node:crypto'
import { TOKEN_BYTE_LENGTH } from '@/lib/domains/model/constants'

export const generateVerificationToken = (): string =>
  randomBytes(TOKEN_BYTE_LENGTH).toString('base64url')
