import { containsExpectedValue } from '@/lib/dns/check'
import { RECORD_VALUE_PREFIX } from '@/lib/dns/constants'
import { challengeRecordName } from '@/lib/dns/normalize'
import { TXT_LOOKUP_SOURCES } from '@/lib/dns/types'
import type { CheckVerdict, TxtLookupSource } from '@/lib/dns/types'
import type { CheckView, DomainView } from './view'

const TOKEN_TAIL_LENGTH = 6
const SECOND_MS = 1000

export type SourcePillState = 'match' | 'stale_value' | 'missing' | 'error' | 'unchecked'

export type SourcePillView = {
  source: TxtLookupSource
  label: string
  state: SourcePillState
  cachedUntil: string | null
}

const SOURCE_LABELS: Record<TxtLookupSource, string> = {
  authoritative: 'Your nameservers (source of truth)',
  doh_cloudflare: 'Cloudflare 1.1.1.1',
  doh_google: 'Google 8.8.8.8',
}

export const deriveSourcePills = (
  check: CheckView | null,
  expectedValue: string,
): SourcePillView[] =>
  TXT_LOOKUP_SOURCES.map((source) => {
    const label = SOURCE_LABELS[source]
    const snapshot = check?.sources.find((entry) => entry.source === source)
    if (!check || !snapshot) return { source, label, state: 'unchecked', cachedUntil: null }
    if (snapshot.kind === 'lookup_error') return { source, label, state: 'error', cachedUntil: null }
    if (snapshot.kind === 'records' && containsExpectedValue(snapshot.values, expectedValue)) {
      return { source, label, state: 'match', cachedUntil: null }
    }
    const cachedUntil =
      snapshot.minTtlSeconds !== null
        ? new Date(
            new Date(check.checkedAt).getTime() + snapshot.minTtlSeconds * SECOND_MS,
          ).toISOString()
        : null
    if (snapshot.kind === 'records') return { source, label, state: 'stale_value', cachedUntil }
    return { source, label, state: 'missing', cachedUntil }
  })

export type Diagnosis = {
  verdict: CheckVerdict
  title: string
  body: string
  expectedTail: string | null
  foundTail: string | null
}

const stripQuotes = (value: string): string => {
  const trimmed = value.trim()
  const isQuoted = trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"')
  return isQuoted ? trimmed.slice(1, -1).trim() : trimmed
}

const tokenTail = (value: string): string => `…${value.slice(-TOKEN_TAIL_LENGTH)}`

export const deriveDiagnosis = (
  domain: DomainView,
  check: CheckView | null,
  expectedValue: string,
): Diagnosis | null => {
  if (!check || check.verdict === 'verified' || check.verdict === 'no_record') return null
  if (check.verdict === 'misplaced_record') {
    return {
      verdict: check.verdict,
      title: 'Your DNS provider doubled the record name',
      body: `We found your token at ${domain.challengeHost}.${domain.registrableDomain}, which means your provider added the domain to the Host field automatically. Edit the record and set the Host field to just ${challengeRecordName(domain.challengeHost, domain.registrableDomain)}.`,
      expectedTail: null,
      foundTail: null,
    }
  }
  if (check.verdict === 'wrong_value') {
    const staleValue = check.foundValues
      .map(stripQuotes)
      .find((value) => value.startsWith(RECORD_VALUE_PREFIX))
    return {
      verdict: check.verdict,
      title: 'Found a domainify record with a different token',
      body: 'If you regenerated the token, update or remove the old record so only the current one remains.',
      expectedTail: tokenTail(expectedValue),
      foundTail: staleValue ? tokenTail(staleValue) : null,
    }
  }
  return {
    verdict: check.verdict,
    title: "We couldn't reach your domain's nameservers",
    body: "This is usually a temporary outage (SERVFAIL or timeout), not a problem with your record. We'll keep retrying, and it never counts against your verification window.",
    expectedTail: null,
    foundTail: null,
  }
}
