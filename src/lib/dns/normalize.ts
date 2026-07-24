import { parse } from 'tldts'
import { CHALLENGE_LABEL, MAX_HOSTNAME_LENGTH } from './constants'

export type NormalizedDomain = {
  hostname: string
  registrableDomain: string
  isApex: boolean
  challengeHost: string
}

export const DOMAIN_INPUT_ERROR_CODES = [
  'empty',
  'unparseable',
  'ip_address',
  'public_suffix',
  'platform_suffix',
  'invalid_hostname',
] as const
export type DomainInputErrorCode = (typeof DOMAIN_INPUT_ERROR_CODES)[number]

export type DomainInputError = {
  code: DomainInputErrorCode
  message: string
}

export type NormalizationResult =
  | { ok: true; domain: NormalizedDomain }
  | { ok: false; error: DomainInputError }

const SCHEME_PATTERN = /^[a-z][a-z0-9+.-]*:\/\//i
const HOSTNAME_LABEL_PATTERN = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/

const failure = (code: DomainInputErrorCode, message: string): NormalizationResult => ({
  ok: false,
  error: { code, message },
})

const extractHostname = (input: string): string | null => {
  const candidate = SCHEME_PATTERN.test(input) ? input : `https://${input}`
  try {
    return new URL(candidate).hostname
  } catch {
    return null
  }
}

export const normalizeDomainInput = (rawInput: string): NormalizationResult => {
  const trimmed = rawInput.trim().toLowerCase()
  if (!trimmed) {
    return failure('empty', 'Enter a domain name.')
  }
  const hostname = extractHostname(trimmed)?.replace(/\.$/, '')
  if (!hostname) {
    return failure('unparseable', `"${rawInput.trim()}" does not look like a domain name.`)
  }
  if (hostname.length > MAX_HOSTNAME_LENGTH) {
    return failure('invalid_hostname', 'That name is longer than DNS allows.')
  }
  const parsed = parse(hostname, { allowPrivateDomains: true })
  if (parsed.isIp) {
    return failure('ip_address', 'IP addresses cannot be claimed. Enter a domain name instead.')
  }
  if (!parsed.domain || hostname === parsed.publicSuffix) {
    return parsed.isPrivate
      ? failure(
          'platform_suffix',
          `"${hostname}" belongs to a hosting platform, so its DNS is controlled by the platform operator.`,
        )
      : failure('public_suffix', `"${hostname}" is a public suffix, not a claimable domain.`)
  }
  if (parsed.isPrivate) {
    return failure(
      'platform_suffix',
      `"${parsed.publicSuffix}" subdomains belong to the hosting platform, so their DNS cannot prove ownership.`,
    )
  }
  const labels = hostname.split('.')
  if (!labels.every((label) => HOSTNAME_LABEL_PATTERN.test(label))) {
    return failure('invalid_hostname', 'Domain labels can only contain letters, numbers, and hyphens.')
  }
  return {
    ok: true,
    domain: {
      hostname,
      registrableDomain: parsed.domain,
      isApex: hostname === parsed.domain,
      challengeHost: `${CHALLENGE_LABEL}.${hostname}`,
    },
  }
}
