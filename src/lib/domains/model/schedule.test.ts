import { describe, expect, it } from 'vitest'
import { computeNextCheckAt, cooldownRemainingMs, nextCheckDelayMs, pollDelaySeconds } from './schedule'

const MINUTE_MS = 60 * 1000
const HOUR_MS = 60 * MINUTE_MS
const now = new Date('2026-07-26T12:00:00Z')

describe('nextCheckDelayMs', () => {
  it('starts at one minute', () => {
    expect(nextCheckDelayMs(0)).toBe(MINUTE_MS)
  })

  it('grows exponentially with each attempt', () => {
    expect(nextCheckDelayMs(1)).toBe(MINUTE_MS * 1.15)
    expect(nextCheckDelayMs(5)).toBeGreaterThan(nextCheckDelayMs(4))
  })

  it('keeps the first ten checks inside half an hour of cumulative delay', () => {
    let cumulativeMs = 0
    for (let attempt = 0; attempt < 10; attempt += 1) {
      cumulativeMs += nextCheckDelayMs(attempt)
    }
    expect(cumulativeMs).toBeLessThan(30 * MINUTE_MS)
  })

  it('caps at four hours', () => {
    expect(nextCheckDelayMs(100)).toBe(4 * HOUR_MS)
  })
})

describe('computeNextCheckAt', () => {
  it('stops scheduling for failed domains', () => {
    expect(computeNextCheckAt('failed', 3, now)).toBeNull()
  })

  it('re-validates verified domains on a daily tick regardless of attempts', () => {
    expect(computeNextCheckAt('verified', 0, now)?.getTime()).toBe(now.getTime() + 24 * HOUR_MS)
    expect(computeNextCheckAt('verified', 40, now)?.getTime()).toBe(now.getTime() + 24 * HOUR_MS)
  })

  it('applies the backoff cadence to pending and temporary_failure domains', () => {
    expect(computeNextCheckAt('pending', 0, now)?.getTime()).toBe(now.getTime() + MINUTE_MS)
    expect(computeNextCheckAt('temporary_failure', 0, now)?.getTime()).toBe(
      now.getTime() + MINUTE_MS,
    )
  })
})

describe('pollDelaySeconds', () => {
  it('starts at 30 seconds and doubles per failure', () => {
    expect(pollDelaySeconds(0)).toBe(30)
    expect(pollDelaySeconds(1)).toBe(60)
    expect(pollDelaySeconds(2)).toBe(120)
    expect(pollDelaySeconds(3)).toBe(240)
  })

  it('caps at 300 seconds', () => {
    expect(pollDelaySeconds(4)).toBe(300)
    expect(pollDelaySeconds(10)).toBe(300)
  })
})

describe('cooldownRemainingMs', () => {
  it('returns 0 when there was no previous attempt', () => {
    expect(cooldownRemainingMs(null, 5000, now)).toBe(0)
  })

  it('returns 0 once the cooldown has fully elapsed', () => {
    const lastAttemptAt = new Date(now.getTime() - 5000)
    expect(cooldownRemainingMs(lastAttemptAt, 5000, now)).toBe(0)
  })

  it('returns the remaining milliseconds mid-cooldown', () => {
    const lastAttemptAt = new Date(now.getTime() - 2000)
    expect(cooldownRemainingMs(lastAttemptAt, 5000, now)).toBe(3000)
  })
})
