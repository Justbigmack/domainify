import { NextResponse } from 'next/server'
import { serviceErrorResponse, unauthorizedResponse } from '@/lib/http/responses'
import { getSessionUser } from '@/lib/auth/session'
import { deleteDomain, getDomainDetail } from '@/lib/domains/service'

type RouteParams = { params: Promise<{ id: string }> }

const HTTP_NO_CONTENT = 204

export const GET = async (request: Request, { params }: RouteParams) => {
  const sessionUser = await getSessionUser()
  if (!sessionUser) return unauthorizedResponse()
  const { id } = await params
  try {
    const detail = await getDomainDetail(sessionUser.id, id)
    return NextResponse.json(detail)
  } catch (error) {
    return serviceErrorResponse(error)
  }
}

export const DELETE = async (request: Request, { params }: RouteParams) => {
  const sessionUser = await getSessionUser()
  if (!sessionUser) return unauthorizedResponse()
  const { id } = await params
  try {
    await deleteDomain(sessionUser.id, id)
    return new NextResponse(null, { status: HTTP_NO_CONTENT })
  } catch (error) {
    return serviceErrorResponse(error)
  }
}
