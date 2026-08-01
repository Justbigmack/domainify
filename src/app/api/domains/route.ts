import { NextResponse } from 'next/server'
import { z } from 'zod'
import { invalidBodyResponse, serviceErrorResponse, unauthorizedResponse } from '@/lib/http/responses'
import { getSessionUser } from '@/lib/auth/session'
import { createDomain, listDomains } from '@/lib/domains/service'

const createDomainBodySchema = z.object({ name: z.string() })

const HTTP_CREATED = 201

export const GET = async () => {
  const sessionUser = await getSessionUser()
  if (!sessionUser) return unauthorizedResponse()
  const userDomains = await listDomains(sessionUser.id)
  return NextResponse.json({ domains: userDomains })
}

export const POST = async (request: Request) => {
  const sessionUser = await getSessionUser()
  if (!sessionUser) return unauthorizedResponse()
  const rawBody = await request.json().catch(() => null)
  const parsedBody = createDomainBodySchema.safeParse(rawBody)
  if (!parsedBody.success) {
    return invalidBodyResponse('Send a JSON body like {"name": "example.com"}.')
  }
  try {
    const domain = await createDomain(sessionUser.id, parsedBody.data.name)
    return NextResponse.json({ domain }, { status: HTTP_CREATED })
  } catch (error) {
    return serviceErrorResponse(error)
  }
}
