import { cache } from 'react'
import { connection } from 'next/server'

export const getRequestTimeMs = cache(async (): Promise<number> => {
  await connection()
  return Date.now()
})
