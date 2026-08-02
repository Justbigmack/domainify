import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { errorResponse } from '@/lib/http/responses'
import { domainsCacheTag } from '@/lib/domains/server/cache'
import { sweepDueDomains } from '@/lib/domains/server/service'

const HTTP_UNAUTHORIZED = 401

export const maxDuration = 300

export const GET = async (request: Request) => {
  const cronSecret = process.env.CRON_SECRET
  const authorizationHeader = request.headers.get('authorization')
  if (!cronSecret || authorizationHeader !== `Bearer ${cronSecret}`) {
    return errorResponse(HTTP_UNAUTHORIZED, 'unauthorized', 'Unauthorized')
  }
  const sweep = await sweepDueDomains(new Date())
  for (const userId of sweep.affectedUserIds) {
    revalidateTag(domainsCacheTag(userId), 'max')
  }
  return NextResponse.json(sweep)
}
