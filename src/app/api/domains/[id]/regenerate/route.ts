import { NextResponse } from 'next/server'
import { serviceErrorResponse, unauthorizedResponse } from '@/lib/http/responses'
import { getApiRequestUser } from '@/lib/auth/server/session'
import { buildRecordInstructions, regenerateToken } from '@/lib/domains/server/service'

type RouteParams = { params: Promise<{ id: string }> }

export const POST = async (request: Request, { params }: RouteParams) => {
  const sessionUser = await getApiRequestUser()
  if (!sessionUser) return unauthorizedResponse()
  const { id } = await params
  try {
    const domain = await regenerateToken(sessionUser.id, id)
    return NextResponse.json({ domain, record: buildRecordInstructions(domain) })
  } catch (error) {
    return serviceErrorResponse(error)
  }
}
