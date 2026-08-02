import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SessionUser } from '@/lib/auth/session'

const mockState = vi.hoisted(() => ({
  sessionUser: null as SessionUser | null,
}))

const service = vi.hoisted(() => ({
  listDomains: vi.fn(),
  createDomain: vi.fn(),
  getDomainDetail: vi.fn(),
  deleteDomain: vi.fn(),
  verifyDomain: vi.fn(),
  restartVerification: vi.fn(),
  regenerateToken: vi.fn(),
  buildRecordInstructions: vi.fn(),
}))

vi.mock('@/lib/auth/session', () => ({
  getApiRequestUser: () => Promise.resolve(mockState.sessionUser),
}))

vi.mock('@/lib/domains/service', () => service)

import {
  DomainNotFoundError,
  DomainStateError,
  VerifyCooldownError,
} from '@/lib/domains/errors'
import { DELETE as deleteDomainRoute, GET as getDomainRoute } from './[id]/route'
import { POST as regenerateTokenRoute } from './[id]/regenerate/route'
import { POST as restartVerificationRoute } from './[id]/restart/route'
import { POST as verifyDomainRoute } from './[id]/verify/route'

const SESSION_USER: SessionUser = { id: 'user-1', email: 'owner@example.com' }
const DOMAIN_ID = 'domain-1'
const routeParams = { params: Promise.resolve({ id: DOMAIN_ID }) }

const domainRequest = (): Request =>
  new Request(`https://domainify.test/api/domains/${DOMAIN_ID}`)

beforeEach(() => {
  mockState.sessionUser = SESSION_USER
  vi.clearAllMocks()
})

describe('authentication', () => {
  it.each([
    ['GET /api/domains/[id]', () => getDomainRoute(domainRequest(), routeParams)],
    ['DELETE /api/domains/[id]', () => deleteDomainRoute(domainRequest(), routeParams)],
    ['POST /api/domains/[id]/verify', () => verifyDomainRoute(domainRequest(), routeParams)],
    ['POST /api/domains/[id]/restart', () => restartVerificationRoute(domainRequest(), routeParams)],
    ['POST /api/domains/[id]/regenerate', () => regenerateTokenRoute(domainRequest(), routeParams)],
  ] as const)('%s rejects an unauthenticated caller', async (_label, call) => {
    mockState.sessionUser = null

    const response = await call()

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({
      error: { code: 'unauthorized', message: 'Provide a valid API key or sign in.' },
    })
    for (const serviceCall of Object.values(service)) {
      expect(serviceCall).not.toHaveBeenCalled()
    }
  })
})

describe('GET /api/domains/[id]', () => {
  it('returns the domain detail for the owner', async () => {
    const detail = { domain: { id: DOMAIN_ID }, checks: [], record: { type: 'TXT' } }
    service.getDomainDetail.mockResolvedValue(detail)

    const response = await getDomainRoute(domainRequest(), routeParams)

    expect(service.getDomainDetail).toHaveBeenCalledWith(SESSION_USER.id, DOMAIN_ID)
    await expect(response.json()).resolves.toEqual(detail)
  })

  it('answers 404 for a domain the caller does not own', async () => {
    service.getDomainDetail.mockRejectedValue(new DomainNotFoundError())

    const response = await getDomainRoute(domainRequest(), routeParams)

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toEqual({
      error: { code: 'not_found', message: 'Domain not found' },
    })
  })
})

describe('DELETE /api/domains/[id]', () => {
  it('answers 204 with an empty body', async () => {
    service.deleteDomain.mockResolvedValue(undefined)

    const response = await deleteDomainRoute(domainRequest(), routeParams)

    expect(service.deleteDomain).toHaveBeenCalledWith(SESSION_USER.id, DOMAIN_ID)
    expect(response.status).toBe(204)
    await expect(response.text()).resolves.toBe('')
  })

  it('answers 404 for a domain the caller does not own', async () => {
    service.deleteDomain.mockRejectedValue(new DomainNotFoundError())

    const response = await deleteDomainRoute(domainRequest(), routeParams)

    expect(response.status).toBe(404)
  })
})

describe('POST /api/domains/[id]/verify', () => {
  it('returns the check result', async () => {
    service.verifyDomain.mockResolvedValue({ verdict: 'match' })

    const response = await verifyDomainRoute(domainRequest(), routeParams)

    expect(service.verifyDomain).toHaveBeenCalledWith(SESSION_USER.id, DOMAIN_ID)
    await expect(response.json()).resolves.toEqual({ verdict: 'match' })
  })

  it('answers 429 with the wait time when the caller is on cooldown', async () => {
    service.verifyDomain.mockRejectedValue(new VerifyCooldownError(15_000))

    const response = await verifyDomainRoute(domainRequest(), routeParams)

    expect(response.status).toBe(429)
    await expect(response.json()).resolves.toEqual({
      error: { code: 'cooldown', message: 'Please wait a moment before checking again.' },
      retryAfterMs: 15_000,
    })
  })
})

describe('POST /api/domains/[id]/restart', () => {
  it('returns the reopened domain', async () => {
    service.restartVerification.mockResolvedValue({ id: DOMAIN_ID, status: 'pending' })

    const response = await restartVerificationRoute(domainRequest(), routeParams)

    await expect(response.json()).resolves.toEqual({
      domain: { id: DOMAIN_ID, status: 'pending' },
    })
  })

  it('answers 409 when the domain has not failed', async () => {
    service.restartVerification.mockRejectedValue(
      new DomainStateError('Verification can only be restarted for failed domains.'),
    )

    const response = await restartVerificationRoute(domainRequest(), routeParams)

    expect(response.status).toBe(409)
    await expect(response.json()).resolves.toEqual({
      error: {
        code: 'invalid_state',
        message: 'Verification can only be restarted for failed domains.',
      },
    })
  })
})

describe('POST /api/domains/[id]/regenerate', () => {
  it('returns the new token alongside the record to publish', async () => {
    const domain = { id: DOMAIN_ID, verificationToken: 'fresh-token' }
    const record = { type: 'TXT', host: '_domainify-challenge.example.com', value: 'fresh' }
    service.regenerateToken.mockResolvedValue(domain)
    service.buildRecordInstructions.mockReturnValue(record)

    const response = await regenerateTokenRoute(domainRequest(), routeParams)

    expect(service.buildRecordInstructions).toHaveBeenCalledWith(domain)
    await expect(response.json()).resolves.toEqual({ domain, record })
  })
})
