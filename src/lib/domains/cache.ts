import { cacheLife, cacheTag } from 'next/cache'
import type { DomainRow } from '@/db/schema'
import { listDomains } from './service'

export const domainsCacheTag = (userId: string): string => `domains-${userId}`

export const getCachedDomains = async (userId: string): Promise<DomainRow[]> => {
  'use cache'
  cacheTag(domainsCacheTag(userId))
  cacheLife('minutes')
  return listDomains(userId)
}
