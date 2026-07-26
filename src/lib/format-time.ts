const MINUTE_MS = 60 * 1000
const HOUR_MS = 60 * MINUTE_MS
const DAY_MS = 24 * HOUR_MS

export const formatRelativeTime = (isoDate: string, nowMs: number): string => {
  const elapsedMs = nowMs - new Date(isoDate).getTime()
  if (elapsedMs < MINUTE_MS) return 'just now'
  if (elapsedMs < HOUR_MS) return `${Math.floor(elapsedMs / MINUTE_MS)}m ago`
  if (elapsedMs < DAY_MS) return `${Math.floor(elapsedMs / HOUR_MS)}h ago`
  return `${Math.floor(elapsedMs / DAY_MS)}d ago`
}

export const formatTimeLeft = (isoDate: string, nowMs: number): string | null => {
  const remainingMs = new Date(isoDate).getTime() - nowMs
  if (remainingMs <= 0) return null
  if (remainingMs < HOUR_MS) return `${Math.ceil(remainingMs / MINUTE_MS)}m left`
  if (remainingMs < DAY_MS) return `${Math.ceil(remainingMs / HOUR_MS)}h left`
  return `${Math.ceil(remainingMs / DAY_MS)}d left`
}
