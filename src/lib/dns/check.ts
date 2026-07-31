import { RECORD_VALUE_PREFIX } from './constants'
import { lookupTxtOverDoh } from './doh'
import type { NormalizedDomain } from './normalize'
import { detectDnsProvider } from './providers'
import type { DnsProvider } from './providers'
import {
  lookupTxt,
  lookupTxtAuthoritative,
  pickVerificationAddresses,
  resolveAuthoritativeNameservers,
} from './resolver'
import type { AuthoritativeTxtResult } from './resolver'
import type { CheckVerdict, TxtLookup } from './types'

export type DomainCheckSources = {
  authoritative: TxtLookup | null
  cloudflare: TxtLookup
  google: TxtLookup
}

export type DomainCheckResult = {
  verdict: CheckVerdict
  foundValues: string[]
  sources: DomainCheckSources
  nameserverHostnames: string[]
  provider: DnsProvider | null
  authoritativeQueriedName: string | null
}

export const buildExpectedRecordValue = (token: string): string =>
  `${RECORD_VALUE_PREFIX}${token}`

const sanitizeTxtValue = (value: string): string => {
  const trimmed = value.trim()
  const isQuoted = trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"')
  return isQuoted ? trimmed.slice(1, -1).trim() : trimmed
}

export const containsExpectedValue = (values: string[], expectedValue: string): boolean =>
  values.some((value) => sanitizeTxtValue(value) === expectedValue)

const lookupMatches = (lookup: TxtLookup | null, expectedValue: string): boolean =>
  lookup?.kind === 'records' && containsExpectedValue(lookup.values, expectedValue)

const collectRecordValues = (lookups: (TxtLookup | null)[]): string[] => {
  const values = lookups.flatMap((lookup) => (lookup?.kind === 'records' ? lookup.values : []))
  return [...new Set(values)]
}

export const isAuthoritativeAgreementReached = (
  lookups: TxtLookup[],
  expectedValue: string,
): boolean => {
  const usableLookups = lookups.filter((lookup) => lookup.kind !== 'lookup_error')
  return (
    usableLookups.length > 0 &&
    usableLookups.every((lookup) => lookupMatches(lookup, expectedValue))
  )
}

const mergeAuthoritativeLookups = (result: AuthoritativeTxtResult | null): TxtLookup | null => {
  if (!result || result.lookups.length === 0) return null
  const recordLookups = result.lookups.filter(
    (lookup): lookup is Extract<TxtLookup, { kind: 'records' }> => lookup.kind === 'records',
  )
  if (recordLookups.length > 0) {
    return {
      kind: 'records',
      values: [...new Set(recordLookups.flatMap((lookup) => lookup.values))],
      minTtlSeconds: null,
    }
  }
  return result.lookups[0]
}

export const checkDomainOwnership = async (
  domain: NormalizedDomain,
  token: string,
): Promise<DomainCheckResult> => {
  const expectedValue = buildExpectedRecordValue(token)
  const nameservers = await resolveAuthoritativeNameservers(domain.registrableDomain)
  const [authoritativeResult, cloudflare, google] = await Promise.all([
    nameservers
      ? lookupTxtAuthoritative(domain.challengeHost, nameservers)
      : Promise.resolve<AuthoritativeTxtResult | null>(null),
    lookupTxtOverDoh(domain.challengeHost, 'cloudflare'),
    lookupTxtOverDoh(domain.challengeHost, 'google'),
  ])
  const authoritative = mergeAuthoritativeLookups(authoritativeResult)
  const nameserverHostnames = nameservers?.map((nameserver) => nameserver.hostname) ?? []
  const base = {
    sources: { authoritative, cloudflare, google },
    nameserverHostnames,
    provider: detectDnsProvider(nameserverHostnames),
    foundValues: collectRecordValues([authoritative, cloudflare, google]),
    authoritativeQueriedName: authoritativeResult?.queriedName ?? null,
  }

  const verifiedViaAuthoritative =
    authoritativeResult !== null &&
    isAuthoritativeAgreementReached(authoritativeResult.lookups, expectedValue)
  const verifiedViaResolverAgreement =
    lookupMatches(cloudflare, expectedValue) && lookupMatches(google, expectedValue)
  if (verifiedViaAuthoritative || verifiedViaResolverAgreement) {
    return { verdict: 'verified', ...base }
  }

  const misplacedHost = `${domain.challengeHost}.${domain.registrableDomain}`
  const misplacedLookup = nameservers
    ? await lookupTxt(misplacedHost, pickVerificationAddresses(nameservers).slice(0, 1))
    : await lookupTxtOverDoh(misplacedHost, 'cloudflare')
  if (lookupMatches(misplacedLookup, expectedValue)) {
    return { verdict: 'misplaced_record', ...base }
  }

  const hasStaleToken = base.foundValues.some((value) =>
    sanitizeTxtValue(value).startsWith(RECORD_VALUE_PREFIX),
  )
  if (hasStaleToken) {
    return { verdict: 'wrong_value', ...base }
  }

  const attemptedLookups = [authoritative, cloudflare, google].filter(
    (lookup): lookup is TxtLookup => lookup !== null,
  )
  const everySourceErrored = attemptedLookups.every((lookup) => lookup.kind === 'lookup_error')
  if (everySourceErrored) {
    return { verdict: 'dns_error', ...base }
  }

  return { verdict: 'no_record', ...base }
}
