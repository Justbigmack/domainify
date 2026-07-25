import { Resolver } from 'node:dns/promises'
import { parse } from 'tldts'
import {
  AUTHORITATIVE_AGREEMENT_COUNT,
  DNS_RETRY_COUNT,
  DNS_TIMEOUT_MS,
  MAX_CNAME_CHAIN_LENGTH,
} from './constants'
import type { TxtLookup } from './types'

export type AuthoritativeNameserver = {
  hostname: string
  addresses: string[]
}

export type AuthoritativeTxtResult = {
  lookups: TxtLookup[]
  queriedName: string
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
    return values.length > 0
      ? { kind: 'records', values, minTtlSeconds: null }
      : { kind: 'no_records' }
  } catch (error) {
    const code = getErrorCode(error)
    if (code === 'ENOTFOUND') return { kind: 'name_not_found' }
    if (code === 'ENODATA') return { kind: 'no_records' }
    return { kind: 'lookup_error', code }
  }
}

export const resolveAuthoritativeNameservers = async (
  registrableDomain: string,
): Promise<AuthoritativeNameserver[] | null> => {
  try {
    const resolver = createResolver()
    const hostnames = await resolver.resolveNs(registrableDomain)
    const nameservers = await Promise.all(
      hostnames.map(async (hostname) => {
        try {
          return { hostname, addresses: await resolver.resolve4(hostname) }
        } catch {
          return { hostname, addresses: [] }
        }
      }),
    )
    const reachable = nameservers.filter((nameserver) => nameserver.addresses.length > 0)
    return reachable.length > 0 ? reachable : null
  } catch {
    return null
  }
}

export const pickVerificationAddresses = (nameservers: AuthoritativeNameserver[]): string[] =>
  nameservers
    .slice(0, AUTHORITATIVE_AGREEMENT_COUNT)
    .map((nameserver) => nameserver.addresses[0])

const resolveCnameTarget = async (name: string, servers: string[]): Promise<string | null> => {
  try {
    const targets = await createResolver(servers).resolveCname(name)
    return targets[0] ?? null
  } catch {
    return null
  }
}

export const lookupTxtAuthoritative = async (
  name: string,
  nameservers: AuthoritativeNameserver[],
): Promise<AuthoritativeTxtResult> => {
  let currentName = name
  let currentNameservers = nameservers
  let lastLookups: TxtLookup[] = []
  for (let hop = 0; hop < MAX_CNAME_CHAIN_LENGTH; hop += 1) {
    const addresses = pickVerificationAddresses(currentNameservers)
    lastLookups = await Promise.all(addresses.map((address) => lookupTxt(currentName, [address])))
    const hasRecords = lastLookups.some((lookup) => lookup.kind === 'records')
    if (hasRecords) {
      return { lookups: lastLookups, queriedName: currentName }
    }
    const cnameTarget = await resolveCnameTarget(currentName, addresses)
    if (!cnameTarget) {
      return { lookups: lastLookups, queriedName: currentName }
    }
    const targetZone = parse(cnameTarget, { allowPrivateDomains: true }).domain
    const targetNameservers = targetZone ? await resolveAuthoritativeNameservers(targetZone) : null
    if (!targetNameservers) {
      return { lookups: lastLookups, queriedName: currentName }
    }
    currentName = cnameTarget
    currentNameservers = targetNameservers
  }
  return { lookups: lastLookups, queriedName: currentName }
}
