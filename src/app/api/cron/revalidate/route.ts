import { NextResponse } from 'next/server'

export const GET = async (request: Request) => {
  const authorizationHeader = request.headers.get('authorization')
  if (authorizationHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return NextResponse.json({ checkedDomains: 0 })
}
