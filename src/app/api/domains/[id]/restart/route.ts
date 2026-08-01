import { NextResponse } from 'next/server'
import { serviceErrorResponse, unauthorizedResponse } from '@/lib/http/responses'
import { getSessionUser } from '@/lib/auth/session'
import { restartVerification } from '@/lib/domains/service'

type RouteParams = { params: Promise<{ id: string }> }

export const POST = async (request: Request, { params }: RouteParams) => {
  const sessionUser = await getSessionUser()
  if (!sessionUser) return unauthorizedResponse()
  const { id } = await params
  try {
    const domain = await restartVerification(sessionUser.id, id)
    return NextResponse.json({ domain })
  } catch (error) {
    return serviceErrorResponse(error)
  }
}
