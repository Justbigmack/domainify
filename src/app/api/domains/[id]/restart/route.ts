import { NextResponse } from 'next/server'
import { toApiDomain } from '@/lib/apiSurface/domainPayload'
import { serviceErrorResponse, unauthorizedResponse } from '@/lib/apiSurface/responses'
import { getApiRequestUser } from '@/lib/auth/server/session'
import { buildRecordInstructions, restartVerification } from '@/lib/domains/server/service'

type RouteParams = { params: Promise<{ id: string }> }

export const POST = async (request: Request, { params }: RouteParams) => {
  const sessionUser = await getApiRequestUser()
  if (!sessionUser) return unauthorizedResponse()
  const { id } = await params
  try {
    const domain = await restartVerification(sessionUser.id, id)
    return NextResponse.json({
      domain: toApiDomain(domain),
      record: buildRecordInstructions(domain),
    })
  } catch (error) {
    return serviceErrorResponse(error)
  }
}
