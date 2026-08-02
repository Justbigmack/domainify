import { cache } from 'react'
import type { RecordStatus } from '@/lib/domains/status'
import { DomainNotFoundError } from './errors'
import { deriveDiagnosis, deriveSourcePills } from './insights'
import type { Diagnosis, SourcePillView } from './insights'
import { getDomainDetail } from './service'
import type { RecordInstructions } from './service'
import { toCheckView, toDomainView } from './view'
import type { DomainView } from './view'

export type DomainPageData = {
  domain: DomainView
  record: RecordInstructions
  diagnosis: Diagnosis | null
  recordStatus: RecordStatus
}

const deriveRecordStatus = (domain: DomainView, pills: SourcePillView[]): RecordStatus => {
  if (domain.status === 'verified') return 'verified'
  if (pills.some((pill) => pill.state === 'match')) return 'pending'
  return 'not_found'
}

export const loadDomainPageData = cache(
  async (userId: string, domainId: string): Promise<DomainPageData | null> => {
    let detail
    try {
      detail = await getDomainDetail(userId, domainId)
    } catch (error) {
      if (error instanceof DomainNotFoundError) return null
      throw error
    }
    const domain = toDomainView(detail.domain)
    const latestCheck = detail.checks.map(toCheckView)[0] ?? null
    const pills = deriveSourcePills(latestCheck, detail.record.value)
    const diagnosis = deriveDiagnosis(domain, latestCheck, detail.record.value)
    const recordStatus = deriveRecordStatus(domain, pills)
    return { domain, record: detail.record, diagnosis, recordStatus }
  },
)
