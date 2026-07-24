import { randomBytes } from 'node:crypto'
import { TOKEN_BYTE_LENGTH } from './constants'

export const generateVerificationToken = (): string =>
  randomBytes(TOKEN_BYTE_LENGTH).toString('base64url')
