import { NextResponse } from 'next/server'
import { z } from 'zod'
import { toApiDomain } from '@/lib/apiSurface/domainPayload'
import { invalidBodyResponse, serviceErrorResponse, unauthorizedResponse } from '@/lib/apiSurface/responses'
import { getApiRequestUser } from '@/lib/auth/server/session'
import { buildRecordInstructions, createDomain, listDomains } from '@/lib/domains/server/service'

const createDomainBodySchema = z.object({ name: z.string() })

const HTTP_CREATED = 201

export const GET = async () => {
  const sessionUser = await getApiRequestUser()
  if (!sessionUser) return unauthorizedResponse()
  const userDomains = await listDomains(sessionUser.id)
  return NextResponse.json({ domains: userDomains.map(toApiDomain) })
}

export const POST = async (request: Request) => {
  const sessionUser = await getApiRequestUser()
  if (!sessionUser) return unauthorizedResponse()
  const rawBody = await request.json().catch(() => null)
  const parsedBody = createDomainBodySchema.safeParse(rawBody)
  if (!parsedBody.success) {
    return invalidBodyResponse('Send a JSON body like {"name": "example.com"}.')
  }
  try {
    const domain = await createDomain(sessionUser.id, parsedBody.data.name)
    return NextResponse.json(
      { domain: toApiDomain(domain), record: buildRecordInstructions(domain) },
      { status: HTTP_CREATED },
    )
  } catch (error) {
    return serviceErrorResponse(error)
  }
}
