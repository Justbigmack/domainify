import { containsExpectedValue } from '@/lib/dns/check'
import { CHALLENGE_LABEL, RECORD_VALUE_PREFIX } from '@/lib/dns/constants'
import { TXT_LOOKUP_SOURCES } from '@/lib/dns/types'
import type { CheckVerdict, TxtLookupSource } from '@/lib/dns/types'
import { GRACE_WINDOW_MS } from './constants'
import type { CheckView, DomainView } from './view'

const RESTART_TOLERANCE_MS = 60 * 1000
const TOKEN_TAIL_LENGTH = 6
const SECOND_MS = 1000

export type DomainEventKey =
  | 'added'
  | 'restarted'
  | 'record_detected'
  | 'verified'
  | 'record_missing'
  | 'failed'

export type DomainEvent = {
  key: DomainEventKey
  label: string
  at: string | null
}

export const deriveDomainEvents = (
  domain: DomainView,
  checks: CheckView[],
  expectedValue: string,
): DomainEvent[] => {
  const events: DomainEvent[] = [{ key: 'added', label: 'Domain added', at: domain.createdAt }]
  const restartDelayMs =
    new Date(domain.tokenGeneratedAt).getTime() - new Date(domain.createdAt).getTime()
  if (restartDelayMs > RESTART_TOLERANCE_MS) {
    events.push({ key: 'restarted', label: 'Verification restarted', at: domain.tokenGeneratedAt })
  }
  if (domain.status === 'failed') {
    events.push({ key: 'failed', label: 'Verification failed', at: domain.lastCheckedAt })
    return events
  }
  const orderedChecks = [...checks].sort((a, b) => a.checkedAt.localeCompare(b.checkedAt))
  const detection = orderedChecks.find(
    (check) =>
      check.verdict === 'verified' || containsExpectedValue(check.foundValues, expectedValue),
  )
  events.push({
    key: 'record_detected',
    label: 'Record detected',
    at: detection?.checkedAt ?? null,
  })
  events.push({ key: 'verified', label: 'Domain verified', at: domain.verifiedAt })
  if (domain.status === 'temporary_failure') {
    const graceStartedAt = domain.graceExpiresAt
      ? new Date(new Date(domain.graceExpiresAt).getTime() - GRACE_WINDOW_MS).toISOString()
      : null
    events.push({ key: 'record_missing', label: 'Record missing', at: graceStartedAt })
  }
  return events
}

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
  if (!check || check.verdict === 'verified') return null
  if (check.verdict === 'no_record') {
    return {
      verdict: check.verdict,
      title: `No TXT record found yet at ${domain.challengeHost}`,
      body: 'Providers usually apply changes in under a minute. We check automatically every 30 seconds while this page is open, so leave it open after adding the record.',
      expectedTail: null,
      foundTail: null,
    }
  }
  if (check.verdict === 'misplaced_record') {
    return {
      verdict: check.verdict,
      title: 'Your DNS provider doubled the record name',
      body: `We found your token at ${domain.challengeHost}.${domain.hostname} — your provider added the domain to the Host field automatically. Edit the record and set the Host field to just ${CHALLENGE_LABEL}.`,
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
      title: 'Found a Domainify record with a different token',
      body: 'If you regenerated the token, update or remove the old record so only the current one remains.',
      expectedTail: tokenTail(expectedValue),
      foundTail: staleValue ? tokenTail(staleValue) : null,
    }
  }
  return {
    verdict: check.verdict,
    title: "We couldn't reach your domain's nameservers",
    body: "This is usually a temporary outage (SERVFAIL or timeout), not a problem with your record. We'll keep retrying — it never counts against your verification window.",
    expectedTail: null,
    foundTail: null,
  }
}
