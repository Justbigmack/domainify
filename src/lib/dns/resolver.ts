import { Resolver } from 'node:dns/promises'
import { DNS_RETRY_COUNT, DNS_TIMEOUT_MS } from './constants'
import type { TxtLookup } from './types'

export type AuthoritativeServers = {
  hostnames: string[]
  addresses: string[]
}

const createResolver = (servers?: string[]): Resolver => {
  const resolver = new Resolver({ timeout: DNS_TIMEOUT_MS, tries: DNS_RETRY_COUNT })
  if (servers && servers.length > 0) {
    resolver.setServers(servers)
  }
  return resolver
}

const isErrnoException = (error: unknown): error is NodeJS.ErrnoException =>
  error instanceof Error && 'code' in error

const getErrorCode = (error: unknown): string =>
  isErrnoException(error) && error.code ? error.code : 'UNKNOWN'

export const lookupTxt = async (name: string, servers?: string[]): Promise<TxtLookup> => {
  try {
    const records = await createResolver(servers).resolveTxt(name)
    const values = records.map((chunks) => chunks.join(''))
    return values.length > 0 ? { kind: 'records', values } : { kind: 'no_records' }
  } catch (error) {
    const code = getErrorCode(error)
    if (code === 'ENOTFOUND') return { kind: 'name_not_found' }
    if (code === 'ENODATA') return { kind: 'no_records' }
    return { kind: 'lookup_error', code }
  }
}

export const resolveAuthoritativeServers = async (
  registrableDomain: string,
): Promise<AuthoritativeServers | null> => {
  try {
    const resolver = createResolver()
    const hostnames = await resolver.resolveNs(registrableDomain)
    const addressGroups = await Promise.all(
      hostnames.map(async (hostname) => {
        try {
          return await resolver.resolve4(hostname)
        } catch {
          return []
        }
      }),
    )
    const addresses = addressGroups.flat()
    return addresses.length > 0 ? { hostnames, addresses } : null
  } catch {
    return null
  }
}
