import { after, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { errorResponse } from '@/lib/apiSurface/responses'
import { domainsCacheTag } from '@/lib/domains/server/cache'
import { sweepDueDomains } from '@/lib/domains/server/service'

const HTTP_UNAUTHORIZED = 401
const HTTP_ACCEPTED = 202

export const maxDuration = 300

const runSweep = async (): Promise<void> => {
  try {
    const sweep = await sweepDueDomains(new Date())
    for (const userId of sweep.affectedUserIds) {
      revalidateTag(domainsCacheTag(userId), 'max')
    }
    console.log('cron sweep', sweep)
  } catch (error) {
    console.error('cron sweep failed', error)
  }
}

export const GET = async (request: Request) => {
  const cronSecret = process.env.CRON_SECRET
  const authorizationHeader = request.headers.get('authorization')
  if (!cronSecret || authorizationHeader !== `Bearer ${cronSecret}`) {
    return errorResponse(HTTP_UNAUTHORIZED, 'unauthorized', 'Unauthorized')
  }
  after(runSweep)
  return NextResponse.json({ started: true }, { status: HTTP_ACCEPTED })
}
