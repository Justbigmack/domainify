import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SessionUser } from '@/lib/auth/session'

const REDIRECT_MESSAGE = 'NEXT_REDIRECT'

const mockState = vi.hoisted(() => ({
  sessionUser: null as SessionUser | null,
}))

const updateTag = vi.hoisted(() => vi.fn())
const redirect = vi.hoisted(() =>
  vi.fn((destination: string): never => {
    throw new Error(`${REDIRECT_MESSAGE} ${destination}`)
  }),
)

const service = vi.hoisted(() => ({
  createDomain: vi.fn(),
  deleteDomain: vi.fn(),
  pollDomain: vi.fn(),
  regenerateToken: vi.fn(),
  restartVerification: vi.fn(),
  verifyDomain: vi.fn(),
}))

vi.mock('next/cache', () => ({ updateTag }))
vi.mock('next/navigation', () => ({ redirect }))
vi.mock('@/lib/auth/session', () => ({ getSessionUser: () => Promise.resolve(mockState.sessionUser) }))
vi.mock('./service', () => service)

import {
  DomainInputInvalidError,
  DomainNotFoundError,
  DuplicateDomainError,
  VerifyCooldownError,
} from './errors'
import {
  createDomainAction,
  deleteDomainAction,
  pollDomainAction,
  regenerateTokenAction,
  restartVerificationAction,
  verifyDomainAction,
} from './actions'

const SESSION_USER: SessionUser = { id: 'user-1', email: 'owner@example.com' }
const DOMAIN_ID = 'domain-1'
const CACHE_TAG = `domains-${SESSION_USER.id}`

const nameFormData = (name: string): FormData => {
  const formData = new FormData()
  formData.set('name', name)
  return formData
}

beforeEach(() => {
  mockState.sessionUser = SESSION_USER
  vi.clearAllMocks()
})

describe('createDomainAction', () => {
  it('sends a signed-out visitor to the login page', async () => {
    mockState.sessionUser = null

    await expect(createDomainAction(null, nameFormData('example.com'))).rejects.toThrow(
      REDIRECT_MESSAGE,
    )
    expect(redirect).toHaveBeenCalledWith('/login')
    expect(service.createDomain).not.toHaveBeenCalled()
  })

  it('sends the visitor to the setup page for the new domain', async () => {
    service.createDomain.mockResolvedValue({ id: DOMAIN_ID })

    await expect(createDomainAction(null, nameFormData('example.com'))).rejects.toThrow(
      REDIRECT_MESSAGE,
    )
    expect(service.createDomain).toHaveBeenCalledWith(SESSION_USER.id, 'example.com')
    expect(updateTag).toHaveBeenCalledWith(CACHE_TAG)
    expect(redirect).toHaveBeenCalledWith(`/domains/add/${DOMAIN_ID}`)
  })

  it('asks for a name when the form field is absent', async () => {
    await expect(createDomainAction(null, new FormData())).resolves.toEqual({
      error: { code: 'empty', message: 'Enter a domain name.' },
    })
    expect(service.createDomain).not.toHaveBeenCalled()
  })

  it('reports the normalization failure without navigating', async () => {
    service.createDomain.mockRejectedValue(
      new DomainInputInvalidError({ code: 'ip_address', message: 'Enter a domain, not an IP.' }),
    )

    await expect(createDomainAction(null, nameFormData('127.0.0.1'))).resolves.toEqual({
      error: { code: 'ip_address', message: 'Enter a domain, not an IP.' },
    })
    expect(redirect).not.toHaveBeenCalled()
    expect(updateTag).not.toHaveBeenCalled()
  })

  it('reports a domain the visitor already added', async () => {
    service.createDomain.mockRejectedValue(new DuplicateDomainError('example.com'))

    await expect(createDomainAction(null, nameFormData('example.com'))).resolves.toEqual({
      error: { code: 'duplicate', message: "You've already added example.com." },
    })
  })

  it('lets an unrecognised failure escape rather than navigating', async () => {
    service.createDomain.mockRejectedValue(new Error('connection terminated'))

    await expect(createDomainAction(null, nameFormData('example.com'))).rejects.toThrow(
      'connection terminated',
    )
    expect(redirect).not.toHaveBeenCalled()
    expect(updateTag).not.toHaveBeenCalled()
  })
})

describe.each([
  ['verifyDomainAction', verifyDomainAction, service.verifyDomain],
  ['pollDomainAction', pollDomainAction, service.pollDomain],
  ['restartVerificationAction', restartVerificationAction, service.restartVerification],
  ['regenerateTokenAction', regenerateTokenAction, service.regenerateToken],
] as const)('%s', (_label, action, serviceCall) => {
  it('reports success and refreshes the cached domain list', async () => {
    serviceCall.mockResolvedValue(undefined)

    await expect(action(DOMAIN_ID)).resolves.toEqual({ ok: true })
    expect(serviceCall).toHaveBeenCalledWith(SESSION_USER.id, DOMAIN_ID)
    expect(updateTag).toHaveBeenCalledWith(CACHE_TAG)
  })

  it('passes the remaining cooldown back to the caller', async () => {
    serviceCall.mockRejectedValue(new VerifyCooldownError(9_000))

    await expect(action(DOMAIN_ID)).resolves.toEqual({
      ok: false,
      error: {
        code: 'cooldown',
        message: 'Please wait a moment before checking again.',
        retryAfterMs: 9_000,
      },
    })
  })

  it('does not refresh the cached domain list when the call fails', async () => {
    serviceCall.mockRejectedValue(new DomainNotFoundError())

    await expect(action(DOMAIN_ID)).resolves.toEqual({
      ok: false,
      error: { code: 'not_found', message: 'Domain not found', retryAfterMs: undefined },
    })
    expect(updateTag).not.toHaveBeenCalled()
  })

  it('lets an unrecognised failure escape', async () => {
    serviceCall.mockRejectedValue(new Error('connection terminated'))

    await expect(action(DOMAIN_ID)).rejects.toThrow('connection terminated')
  })

  it('sends a signed-out visitor to the login page', async () => {
    mockState.sessionUser = null

    await expect(action(DOMAIN_ID)).rejects.toThrow(REDIRECT_MESSAGE)
    expect(redirect).toHaveBeenCalledWith('/login')
    expect(serviceCall).not.toHaveBeenCalled()
  })
})

describe('deleteDomainAction', () => {
  it('returns the visitor to the domain list after removal', async () => {
    service.deleteDomain.mockResolvedValue(undefined)

    await expect(deleteDomainAction(DOMAIN_ID)).rejects.toThrow(REDIRECT_MESSAGE)
    expect(service.deleteDomain).toHaveBeenCalledWith(SESSION_USER.id, DOMAIN_ID)
    expect(updateTag).toHaveBeenCalledWith(CACHE_TAG)
    expect(redirect).toHaveBeenCalledWith('/domains')
  })

  it('stays put and reports when the domain is already gone', async () => {
    service.deleteDomain.mockRejectedValue(new DomainNotFoundError())

    await expect(deleteDomainAction(DOMAIN_ID)).resolves.toEqual({
      ok: false,
      error: { code: 'not_found', message: 'Domain not found', retryAfterMs: undefined },
    })
    expect(redirect).not.toHaveBeenCalled()
  })
})
