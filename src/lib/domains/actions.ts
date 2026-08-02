'use server'

import { updateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth/server/session'
import { domainsCacheTag } from '@/lib/domains/server/cache'
import {
  DomainInputInvalidError,
  DuplicateDomainError,
  toErrorDetail,
} from '@/lib/domains/model/errors'
import {
  createDomain,
  deleteDomain,
  pollDomain,
  regenerateToken,
  restartVerification,
  verifyDomain,
} from '@/lib/domains/server/service'

export type ActionError = {
  code: string
  message: string
  retryAfterMs?: number
}

export type ActionResult = { ok: true } | { ok: false; error: ActionError }

export type CreateDomainState = { error: ActionError } | null

const requireSessionUser = async () => {
  const sessionUser = await getSessionUser()
  if (!sessionUser) redirect('/login')
  return sessionUser
}

const revalidateDomainCache = (userId: string): void => {
  updateTag(domainsCacheTag(userId))
}

const toActionFailure = (error: unknown): ActionResult => {
  const detail = toErrorDetail(error)
  if (!detail) throw error
  return {
    ok: false,
    error: { code: detail.code, message: detail.message, retryAfterMs: detail.retryAfterMs },
  }
}

export const createDomainAction = async (
  _previousState: CreateDomainState,
  formData: FormData,
): Promise<CreateDomainState> => {
  const sessionUser = await requireSessionUser()
  const rawName = formData.get('name')
  if (typeof rawName !== 'string') {
    return { error: { code: 'empty', message: 'Enter a domain name.' } }
  }
  let createdId: string
  try {
    const domain = await createDomain(sessionUser.id, rawName)
    createdId = domain.id
  } catch (error) {
    if (error instanceof DomainInputInvalidError) return { error: error.detail }
    if (error instanceof DuplicateDomainError) {
      return { error: { code: 'duplicate', message: error.message } }
    }
    throw error
  }
  revalidateDomainCache(sessionUser.id)
  redirect(`/domains/add/${createdId}`)
}

export const verifyDomainAction = async (domainId: string): Promise<ActionResult> => {
  const sessionUser = await requireSessionUser()
  try {
    await verifyDomain(sessionUser.id, domainId)
  } catch (error) {
    return toActionFailure(error)
  }
  revalidateDomainCache(sessionUser.id)
  return { ok: true }
}

export const pollDomainAction = async (domainId: string): Promise<ActionResult> => {
  const sessionUser = await requireSessionUser()
  try {
    await pollDomain(sessionUser.id, domainId)
  } catch (error) {
    return toActionFailure(error)
  }
  revalidateDomainCache(sessionUser.id)
  return { ok: true }
}

export const restartVerificationAction = async (domainId: string): Promise<ActionResult> => {
  const sessionUser = await requireSessionUser()
  try {
    await restartVerification(sessionUser.id, domainId)
  } catch (error) {
    return toActionFailure(error)
  }
  revalidateDomainCache(sessionUser.id)
  return { ok: true }
}

export const regenerateTokenAction = async (domainId: string): Promise<ActionResult> => {
  const sessionUser = await requireSessionUser()
  try {
    await regenerateToken(sessionUser.id, domainId)
  } catch (error) {
    return toActionFailure(error)
  }
  revalidateDomainCache(sessionUser.id)
  return { ok: true }
}

export const deleteDomainAction = async (domainId: string): Promise<ActionResult> => {
  const sessionUser = await requireSessionUser()
  try {
    await deleteDomain(sessionUser.id, domainId)
  } catch (error) {
    return toActionFailure(error)
  }
  revalidateDomainCache(sessionUser.id)
  redirect('/domains')
}
