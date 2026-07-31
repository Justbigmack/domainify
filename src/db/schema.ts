import { index, jsonb, pgEnum, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import { CHECK_TRIGGERS, CHECK_VERDICTS } from '../lib/dns/types'
import type { CheckSourceSnapshot } from '../lib/dns/types'
import { DOMAIN_STATUSES } from '../lib/domains/status'
import { user } from './authSchema'

export const domainStatusEnum = pgEnum('domain_status', DOMAIN_STATUSES)
export const checkVerdictEnum = pgEnum('check_verdict', CHECK_VERDICTS)
export const checkTriggerEnum = pgEnum('check_trigger', CHECK_TRIGGERS)

export const domains = pgTable(
  'domains',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    hostname: text('hostname').notNull(),
    registrableDomain: text('registrable_domain').notNull(),
    challengeHost: text('challenge_host').notNull(),
    status: domainStatusEnum('status').notNull().default('pending'),
    verificationToken: text('verification_token').notNull(),
    tokenGeneratedAt: timestamp('token_generated_at').notNull().defaultNow(),
    pendingExpiresAt: timestamp('pending_expires_at').notNull(),
    verifiedAt: timestamp('verified_at'),
    graceExpiresAt: timestamp('grace_expires_at'),
    lastCheckedAt: timestamp('last_checked_at'),
    lastManualCheckAt: timestamp('last_manual_check_at'),
    nextCheckAt: timestamp('next_check_at'),
    dnsProviderId: text('dns_provider_id'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [uniqueIndex('domains_user_hostname_idx').on(table.userId, table.hostname)],
)

export const verificationChecks = pgTable(
  'verification_checks',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    domainId: text('domain_id')
      .notNull()
      .references(() => domains.id, { onDelete: 'cascade' }),
    checkedAt: timestamp('checked_at').notNull().defaultNow(),
    trigger: checkTriggerEnum('trigger').notNull(),
    verdict: checkVerdictEnum('verdict').notNull(),
    foundValues: jsonb('found_values').$type<string[]>().notNull().default([]),
    sources: jsonb('sources').$type<CheckSourceSnapshot[]>().notNull().default([]),
    errorCode: text('error_code'),
  },
  (table) => [index('verification_checks_domain_checked_idx').on(table.domainId, table.checkedAt)],
)

export type DomainRow = typeof domains.$inferSelect
export type VerificationCheckRow = typeof verificationChecks.$inferSelect
