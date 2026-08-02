const TRUSTED_FETCH_SITES = ['same-origin', 'none'] as const

const readRequestHost = (requestHeaders: Headers): string | null =>
  requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host')

export const isSameOriginRequest = (requestHeaders: Headers): boolean => {
  const fetchSite = requestHeaders.get('sec-fetch-site')
  if (fetchSite) return TRUSTED_FETCH_SITES.some((trustedSite) => trustedSite === fetchSite)
  const origin = requestHeaders.get('origin')
  if (!origin) return true
  const requestHost = readRequestHost(requestHeaders)
  if (!requestHost) return false
  try {
    return new URL(origin).host === requestHost
  } catch {
    return false
  }
}
