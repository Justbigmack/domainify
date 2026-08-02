import { NextResponse } from 'next/server'
import { toApiCheck, toApiDomain } from '@/lib/apiSurface/domainPayload'
import { serviceErrorResponse, unauthorizedResponse } from '@/lib/apiSurface/responses'
import { getApiRequestUser } from '@/lib/auth/server/session'
import { verifyDomain } from '@/lib/domains/server/service'

type RouteParams = { params: Promise<{ id: string }> }

export const POST = async (request: Request, { params }: RouteParams) => {
  const sessionUser = await getApiRequestUser()
  if (!sessionUser) return unauthorizedResponse()
  const { id } = await params
  try {
    const result = await verifyDomain(sessionUser.id, id)
    return NextResponse.json({
      domain: toApiDomain(result.domain),
      check: toApiCheck(result.check),
    })
  } catch (error) {
    return serviceErrorResponse(error)
  }
}
