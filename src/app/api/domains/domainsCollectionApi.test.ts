import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SessionUser } from '@/lib/auth/server/session'

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

vi.mock('@/lib/auth/server/session', () => ({
  getApiRequestUser: () => Promise.resolve(mockState.sessionUser),
}))

vi.mock('@/lib/domains/server/service', () => service)

import { toApiDomain } from '@/lib/apiSurface/domainPayload'
import { makeDomain } from '@/lib/domains/domainFixture'
import { DomainInputInvalidError, DuplicateDomainError } from '@/lib/domains/model/errors'
import { GET as listDomainsRoute, POST as createDomainRoute } from './route'

const SESSION_USER: SessionUser = { id: 'user-1', email: 'owner@example.com' }
const UNAUTHORIZED_BODY = {
  error: { code: 'unauthorized', message: 'Provide a valid API key or sign in.' },
}

const jsonRequest = (body: unknown): Request =>
  new Request('https://domainify.test/api/domains', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })

const rawRequest = (body: string): Request =>
  new Request('https://domainify.test/api/domains', { method: 'POST', body })

beforeEach(() => {
  mockState.sessionUser = SESSION_USER
  vi.clearAllMocks()
})

describe('GET /api/domains', () => {
  it('rejects an unauthenticated caller without reaching the service', async () => {
    mockState.sessionUser = null

    const response = await listDomainsRoute()

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual(UNAUTHORIZED_BODY)
    expect(service.listDomains).not.toHaveBeenCalled()
  })

  it('lists only the caller’s domains', async () => {
    service.listDomains.mockResolvedValue([makeDomain()])

    const response = await listDomainsRoute()

    expect(service.listDomains).toHaveBeenCalledWith(SESSION_USER.id)
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ domains: [toApiDomain(makeDomain())] })
  })

  it('never leaks the owner id or the raw token to a list caller', async () => {
    service.listDomains.mockResolvedValue([makeDomain({ verificationToken: 'secret-token' })])

    const response = await listDomainsRoute()

    const body = await response.text()
    expect(body).not.toContain('secret-token')
    expect(body).not.toContain(SESSION_USER.id)
  })
})

describe('POST /api/domains', () => {
  it('rejects an unauthenticated caller without reaching the service', async () => {
    mockState.sessionUser = null

    const response = await createDomainRoute(jsonRequest({ name: 'example.com' }))

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual(UNAUTHORIZED_BODY)
    expect(service.createDomain).not.toHaveBeenCalled()
  })

  it('creates a domain and answers 201 with the record to publish', async () => {
    const domain = makeDomain()
    const record = {
      type: 'TXT',
      host: '_domainify-challenge.example.com',
      name: '_domainify-challenge',
      value: 'domainify-domain-verification=token',
    }
    service.createDomain.mockResolvedValue(domain)
    service.buildRecordInstructions.mockReturnValue(record)

    const response = await createDomainRoute(jsonRequest({ name: 'example.com' }))

    expect(service.createDomain).toHaveBeenCalledWith(SESSION_USER.id, 'example.com')
    expect(service.buildRecordInstructions).toHaveBeenCalledWith(domain)
    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toEqual({ domain: toApiDomain(domain), record })
  })

  it.each([
    ['a missing name', jsonRequest({})],
    ['a non-string name', jsonRequest({ name: 42 })],
    ['a body that is not JSON', rawRequest('example.com')],
  ])('rejects %s with 422', async (_label, request) => {
    const response = await createDomainRoute(request)

    expect(response.status).toBe(422)
    await expect(response.json()).resolves.toEqual({
      error: {
        code: 'invalid_body',
        message: 'Send a JSON body like {"name": "example.com"}.',
      },
    })
    expect(service.createDomain).not.toHaveBeenCalled()
  })

  it('surfaces the normalization code for an unusable hostname', async () => {
    service.createDomain.mockRejectedValue(
      new DomainInputInvalidError({ code: 'public_suffix', message: 'Add a domain you own.' }),
    )

    const response = await createDomainRoute(jsonRequest({ name: 'co.uk' }))

    expect(response.status).toBe(422)
    await expect(response.json()).resolves.toEqual({
      error: { code: 'public_suffix', message: 'Add a domain you own.' },
    })
  })

  it('answers 409 when the caller already added the domain', async () => {
    service.createDomain.mockRejectedValue(new DuplicateDomainError('example.com'))

    const response = await createDomainRoute(jsonRequest({ name: 'example.com' }))

    expect(response.status).toBe(409)
    await expect(response.json()).resolves.toEqual({
      error: { code: 'duplicate', message: "You've already added example.com." },
    })
  })

  it('lets an unrecognised failure escape rather than reporting success', async () => {
    service.createDomain.mockRejectedValue(new Error('connection terminated'))

    await expect(createDomainRoute(jsonRequest({ name: 'example.com' }))).rejects.toThrow(
      'connection terminated',
    )
  })
})
