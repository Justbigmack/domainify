import type { DomainStatus } from './status'

const BASE_DELAY_MS = 60 * 1000
const BACKOFF_FACTOR = 1.15
const MAX_DELAY_MS = 4 * 60 * 60 * 1000
const VERIFIED_RECHECK_INTERVAL_MS = 24 * 60 * 60 * 1000

export const nextCheckDelayMs = (attemptCount: number): number =>
  Math.min(BASE_DELAY_MS * BACKOFF_FACTOR ** attemptCount, MAX_DELAY_MS)

export const computeNextCheckAt = (
  status: DomainStatus,
  attemptCount: number,
  now: Date,
): Date | null => {
  if (status === 'failed') return null
  if (status === 'verified') return new Date(now.getTime() + VERIFIED_RECHECK_INTERVAL_MS)
  return new Date(now.getTime() + nextCheckDelayMs(attemptCount))
}
