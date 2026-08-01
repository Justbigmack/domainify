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

const POLL_BASE_DELAY_SECONDS = 30
const POLL_BACKOFF_FACTOR = 2
const POLL_MAX_DELAY_SECONDS = 300

export const pollDelaySeconds = (failureCount: number): number =>
  Math.min(POLL_BASE_DELAY_SECONDS * POLL_BACKOFF_FACTOR ** failureCount, POLL_MAX_DELAY_SECONDS)

export const cooldownRemainingMs = (
  lastAttemptAt: Date | null,
  cooldownMs: number,
  now: Date,
): number => {
  if (lastAttemptAt === null) return 0
  const elapsedMs = now.getTime() - lastAttemptAt.getTime()
  return Math.max(cooldownMs - elapsedMs, 0)
}
