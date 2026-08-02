const EXAMPLE_TOKEN = 'Qq3vYx8kq3o0aZ0m8m2S9uJb4bqfM0HqfncBta8HVEo'
const EXAMPLE_RECORD_VALUE = `domainify-domain-verification=${EXAMPLE_TOKEN}`

const EXAMPLE_PENDING_DOMAIN = {
  id: '2fbe5ad2-8a01-4b8c-9d5e-6f2a7c4e91b3',
  hostname: 'app.example.com',
  registrableDomain: 'example.com',
  challengeHost: '_domainify-challenge.app.example.com',
  status: 'pending',
  createdAt: '2026-07-30T09:12:44.000Z',
  pendingExpiresAt: '2026-08-02T09:12:44.000Z',
  verifiedAt: null,
  graceExpiresAt: null,
  lastCheckedAt: '2026-07-30T09:13:52.000Z',
  nextCheckAt: '2026-07-30T09:15:01.000Z',
  dnsProviderId: 'cloudflare',
}

const EXAMPLE_VERIFIED_DOMAIN = {
  ...EXAMPLE_PENDING_DOMAIN,
  status: 'verified',
  verifiedAt: '2026-07-30T09:41:07.000Z',
  lastCheckedAt: '2026-07-30T09:41:07.000Z',
  nextCheckAt: '2026-07-31T09:41:07.000Z',
}

const EXAMPLE_RECORD = {
  type: 'TXT',
  host: '_domainify-challenge.app.example.com',
  name: '_domainify-challenge.app',
  value: EXAMPLE_RECORD_VALUE,
}

const EXAMPLE_SOURCES = [
  {
    source: 'authoritative',
    kind: 'records',
    values: [EXAMPLE_RECORD_VALUE],
    minTtlSeconds: 300,
    errorCode: null,
  },
  {
    source: 'doh_cloudflare',
    kind: 'records',
    values: [EXAMPLE_RECORD_VALUE],
    minTtlSeconds: 285,
    errorCode: null,
  },
  {
    source: 'doh_google',
    kind: 'records',
    values: [EXAMPLE_RECORD_VALUE],
    minTtlSeconds: 300,
    errorCode: null,
  },
]

const EXAMPLE_CHECK = {
  id: '9c41d7b6-3e58-4f02-8a17-b5c9e0d2f6a4',
  domainId: EXAMPLE_PENDING_DOMAIN.id,
  checkedAt: '2026-07-30T09:41:07.000Z',
  trigger: 'manual',
  verdict: 'verified',
  foundValues: [EXAMPLE_RECORD_VALUE],
  sources: EXAMPLE_SOURCES,
  errorCode: null,
}

const toJson = (value: object): string => JSON.stringify(value, null, 2)

export const LIST_DOMAINS_EXAMPLE = toJson({
  domains: [EXAMPLE_VERIFIED_DOMAIN],
})

export const CREATE_DOMAIN_EXAMPLE = toJson({
  domain: EXAMPLE_PENDING_DOMAIN,
  record: EXAMPLE_RECORD,
})

export const GET_DOMAIN_EXAMPLE = toJson({
  domain: EXAMPLE_VERIFIED_DOMAIN,
  checks: [EXAMPLE_CHECK],
  record: EXAMPLE_RECORD,
})

export const VERIFY_DOMAIN_EXAMPLE = toJson({
  domain: EXAMPLE_VERIFIED_DOMAIN,
  check: EXAMPLE_CHECK,
})

const EXAMPLE_FRESH_TOKEN = 'nT7wLc2eF9xViS5dK8gA1zHqYp4mB6rUj3oE0yPaWQk'

const EXAMPLE_FRESH_RECORD = {
  ...EXAMPLE_RECORD,
  value: `domainify-domain-verification=${EXAMPLE_FRESH_TOKEN}`,
}

export const RESTART_DOMAIN_EXAMPLE = toJson({
  domain: {
    ...EXAMPLE_PENDING_DOMAIN,
    pendingExpiresAt: '2026-08-03T14:02:10.000Z',
    lastCheckedAt: null,
    nextCheckAt: '2026-07-31T14:03:10.000Z',
  },
  record: EXAMPLE_FRESH_RECORD,
})

export const REGENERATE_DOMAIN_EXAMPLE = toJson({
  domain: EXAMPLE_PENDING_DOMAIN,
  record: EXAMPLE_FRESH_RECORD,
})

export const ERROR_SHAPE_EXAMPLE = toJson({
  error: {
    code: 'duplicate',
    message: "You've already added app.example.com.",
  },
})

export const COOLDOWN_ERROR_EXAMPLE = toJson({
  error: {
    code: 'cooldown',
    message: 'Please wait a moment before checking again.',
  },
  retryAfterMs: 3200,
})
