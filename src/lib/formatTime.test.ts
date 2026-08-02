import { describe, expect, it } from 'vitest'
import { formatRelativeTime, formatShortDate, formatTimeLeft } from './formatTime'

const MINUTE_MS = 60 * 1000
const HOUR_MS = 60 * MINUTE_MS
const DAY_MS = 24 * HOUR_MS

describe('formatShortDate', () => {
  it('formats a timestamp in UTC', () => {
    expect(formatShortDate('2026-08-02T12:00:00.000Z')).toBe('Aug 2, 2026')
  })

  it('reads the same on both sides of midnight UTC regardless of the host timezone', () => {
    expect(formatShortDate('2026-08-02T23:30:00.000Z')).toBe('Aug 2, 2026')
    expect(formatShortDate('2026-08-03T00:30:00.000Z')).toBe('Aug 3, 2026')
  })
})

describe('formatRelativeTime', () => {
  const nowMs = Date.parse('2026-08-02T12:00:00.000Z')

  it('labels the last minute as just now', () => {
    expect(formatRelativeTime('2026-08-02T11:59:30.000Z', nowMs)).toBe('just now')
  })

  it('counts minutes, hours and days', () => {
    expect(formatRelativeTime(new Date(nowMs - 5 * MINUTE_MS).toISOString(), nowMs)).toBe('5m ago')
    expect(formatRelativeTime(new Date(nowMs - 3 * HOUR_MS).toISOString(), nowMs)).toBe('3h ago')
    expect(formatRelativeTime(new Date(nowMs - 2 * DAY_MS).toISOString(), nowMs)).toBe('2d ago')
  })
})

describe('formatTimeLeft', () => {
  const nowMs = Date.parse('2026-08-02T12:00:00.000Z')

  it('returns null once the deadline has passed', () => {
    expect(formatTimeLeft(new Date(nowMs - MINUTE_MS).toISOString(), nowMs)).toBeNull()
  })

  it('rounds the remaining time up', () => {
    expect(formatTimeLeft(new Date(nowMs + 90 * 1000).toISOString(), nowMs)).toBe('2m left')
    expect(formatTimeLeft(new Date(nowMs + 90 * MINUTE_MS).toISOString(), nowMs)).toBe('2h left')
  })
})
