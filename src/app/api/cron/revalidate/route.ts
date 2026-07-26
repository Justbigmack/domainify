import { NextResponse } from 'next/server'
import { errorResponse } from '@/lib/api/responses'
import { sweepDueDomains } from '@/lib/domains/service'

const HTTP_UNAUTHORIZED = 401

export const GET = async (request: Request) => {
  const authorizationHeader = request.headers.get('authorization')
  if (authorizationHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return errorResponse(HTTP_UNAUTHORIZED, 'unauthorized', 'Unauthorized')
  }
  const checkedDomains = await sweepDueDomains(new Date())
  return NextResponse.json({ checkedDomains })
}
