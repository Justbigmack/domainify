import { and, asc, desc, eq, inArray, lte } from 'drizzle-orm'
import { db } from '@/db'
import { domains, verificationChecks } from '@/db/schema'
import type { DomainRow, VerificationCheckRow } from '@/db/schema'
import { buildExpectedRecordValue } from '@/lib/dns/check'
import { normalizeDomainInput } from '@/lib/dns/normalize'
import { detectDnsProvider } from '@/lib/dns/providers'
import { resolveAuthoritativeNameservers } from '@/lib/dns/resolver'
import { runCheck } from './checks'
import type { CheckRunResult } from './checks'
import {
  MANUAL_CHECK_COOLDOWN_MS,
  PENDING_WINDOW_MS,
  STALE_CHECK_THRESHOLD_MS,
} from './constants'
import {
  DomainInputInvalidError,
  DomainNotFoundError,
  DomainStateError,
  DuplicateDomainError,
  VerifyCooldownError,
  isUniqueViolation,
} from './errors'
import { generateVerificationToken } from './token'

const RECENT_CHECKS_LIMIT = 20
const CRON_BATCH_SIZE = 25
const CHECKABLE_STATUSES = ['pending', 'verified', 'temporary_failure'] as const

export type RecordInstructions = {
  type: 'TXT'
  host: string
  value: string
}

export type DomainDetail = {
  domain: DomainRow
  checks: VerificationCheckRow[]
  record: RecordInstructions
}

export const buildRecordInstructions = (domain: DomainRow): RecordInstructions => ({
  type: 'TXT',
  host: domain.challengeHost,
  value: buildExpectedRecordValue(domain.verificationToken),
})

const applyDetectedProvider = async (domain: DomainRow): Promise<void> => {
  const nameservers = await resolveAuthoritativeNameservers(domain.registrableDomain)
  const provider = detectDnsProvider((nameservers ?? []).map((entry) => entry.hostname))
  if (!provider) return
  await db.update(domains).set({ dnsProviderId: provider.id }).where(eq(domains.id, domain.id))
}

const getOwnedDomain = async (userId: string, domainId: string): Promise<DomainRow> => {
  const [domain] = await db
    .select()
    .from(domains)
    .where(and(eq(domains.id, domainId), eq(domains.userId, userId)))
  if (!domain) throw new DomainNotFoundError()
  return domain
}

export const listDomains = async (userId: string): Promise<DomainRow[]> =>
  db.select().from(domains).where(eq(domains.userId, userId)).orderBy(desc(domains.createdAt))

export const createDomain = async (userId: string, rawInput: string): Promise<DomainRow> => {
  const normalized = normalizeDomainInput(rawInput)
  if (!normalized.ok) throw new DomainInputInvalidError(normalized.error)
  const now = new Date()
  try {
    const [created] = await db
      .insert(domains)
      .values({
        userId,
        hostname: normalized.domain.hostname,
        registrableDomain: normalized.domain.registrableDomain,
        challengeHost: normalized.domain.challengeHost,
        verificationToken: generateVerificationToken(),
        tokenGeneratedAt: now,
        pendingExpiresAt: new Date(now.getTime() + PENDING_WINDOW_MS),
        nextCheckAt: now,
      })
      .returning()
    void applyDetectedProvider(created).catch(() => undefined)
    return created
  } catch (error) {
    if (isUniqueViolation(error)) throw new DuplicateDomainError(normalized.domain.hostname)
    throw error
  }
}

const isStale = (domain: DomainRow, now: Date): boolean =>
  domain.status !== 'failed' &&
  (domain.lastCheckedAt === null ||
    now.getTime() - domain.lastCheckedAt.getTime() > STALE_CHECK_THRESHOLD_MS)

export const getDomainDetail = async (
  userId: string,
  domainId: string,
): Promise<DomainDetail> => {
  let domain = await getOwnedDomain(userId, domainId)
  if (isStale(domain, new Date())) {
    const result = await runCheck(domain, 'on_read')
    domain = result.domain
  }
  const checks = await db
    .select()
    .from(verificationChecks)
    .where(eq(verificationChecks.domainId, domain.id))
    .orderBy(desc(verificationChecks.checkedAt))
    .limit(RECENT_CHECKS_LIMIT)
  return { domain, checks, record: buildRecordInstructions(domain) }
}

export const verifyDomain = async (
  userId: string,
  domainId: string,
): Promise<CheckRunResult> => {
  const domain = await getOwnedDomain(userId, domainId)
  const now = new Date()
  if (domain.lastManualCheckAt !== null) {
    const elapsedMs = now.getTime() - domain.lastManualCheckAt.getTime()
    if (elapsedMs < MANUAL_CHECK_COOLDOWN_MS) {
      throw new VerifyCooldownError(MANUAL_CHECK_COOLDOWN_MS - elapsedMs)
    }
  }
  await db.update(domains).set({ lastManualCheckAt: now }).where(eq(domains.id, domain.id))
  return runCheck({ ...domain, lastManualCheckAt: now }, 'manual')
}

export const pollDomain = async (userId: string, domainId: string): Promise<CheckRunResult> => {
  const domain = await getOwnedDomain(userId, domainId)
  return runCheck(domain, 'poll')
}

export const restartVerification = async (
  userId: string,
  domainId: string,
): Promise<DomainRow> => {
  const domain = await getOwnedDomain(userId, domainId)
  if (domain.status !== 'failed') {
    throw new DomainStateError('Verification can only be restarted for failed domains.')
  }
  const now = new Date()
  const [updated] = await db
    .update(domains)
    .set({
      status: 'pending',
      verificationToken: generateVerificationToken(),
      tokenGeneratedAt: now,
      pendingExpiresAt: new Date(now.getTime() + PENDING_WINDOW_MS),
      verifiedAt: null,
      graceExpiresAt: null,
      nextCheckAt: now,
    })
    .where(eq(domains.id, domain.id))
    .returning()
  return updated
}

export const regenerateToken = async (userId: string, domainId: string): Promise<DomainRow> => {
  const domain = await getOwnedDomain(userId, domainId)
  const now = new Date()
  const revertsToPending = domain.status === 'verified' || domain.status === 'temporary_failure'
  const [updated] = await db
    .update(domains)
    .set({
      verificationToken: generateVerificationToken(),
      tokenGeneratedAt: now,
      status: revertsToPending ? 'pending' : domain.status,
      pendingExpiresAt: revertsToPending
        ? new Date(now.getTime() + PENDING_WINDOW_MS)
        : domain.pendingExpiresAt,
      verifiedAt: revertsToPending ? null : domain.verifiedAt,
      graceExpiresAt: revertsToPending ? null : domain.graceExpiresAt,
      nextCheckAt: domain.status === 'failed' ? domain.nextCheckAt : now,
    })
    .where(eq(domains.id, domain.id))
    .returning()
  return updated
}

export const deleteDomain = async (userId: string, domainId: string): Promise<void> => {
  const domain = await getOwnedDomain(userId, domainId)
  await db.delete(domains).where(eq(domains.id, domain.id))
}

export const sweepDueDomains = async (now: Date): Promise<number> => {
  const dueDomains = await db
    .select()
    .from(domains)
    .where(
      and(lte(domains.nextCheckAt, now), inArray(domains.status, [...CHECKABLE_STATUSES])),
    )
    .orderBy(asc(domains.nextCheckAt))
    .limit(CRON_BATCH_SIZE)
  for (const domain of dueDomains) {
    await runCheck(domain, 'cron')
  }
  return dueDomains.length
}
