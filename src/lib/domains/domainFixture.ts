import type { DomainRow } from '@/db/schema'

export const FIXTURE_NOW = new Date('2026-08-02T12:00:00Z')

const HOUR_MS = 60 * 60 * 1000

export const makeDomain = (overrides: Partial<DomainRow> = {}): DomainRow => ({
  id: 'domain-1',
  userId: 'user-1',
  hostname: 'example.com',
  registrableDomain: 'example.com',
  challengeHost: '_domainify-challenge.example.com',
  status: 'pending',
  verificationToken: 'old-token',
  tokenGeneratedAt: new Date(FIXTURE_NOW.getTime() - 80 * HOUR_MS),
  pendingExpiresAt: new Date(FIXTURE_NOW.getTime() - 8 * HOUR_MS),
  verifiedAt: null,
  graceExpiresAt: null,
  lastCheckedAt: new Date(FIXTURE_NOW.getTime() - HOUR_MS),
  lastManualCheckAt: null,
  nextCheckAt: new Date(FIXTURE_NOW.getTime() - HOUR_MS),
  dnsProviderId: null,
  createdAt: new Date(FIXTURE_NOW.getTime() - 80 * HOUR_MS),
  ...overrides,
})
