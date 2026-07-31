import type { RecordStatus } from '@/lib/domains/status'
import { DomainNotFoundError } from './errors'
import { deriveDiagnosis, deriveSourcePills } from './insights'
import type { Diagnosis, SourcePillView } from './insights'
import { getDomainDetail } from './service'
import type { RecordInstructions } from './service'
import { toCheckView, toDomainView } from './view'
import type { CheckView, DomainView } from './view'

export type DomainPageData = {
  domain: DomainView
  checks: CheckView[]
  record: RecordInstructions
  latestCheck: CheckView | null
  diagnosis: Diagnosis | null
  recordStatus: RecordStatus
}

const deriveRecordStatus = (domain: DomainView, pills: SourcePillView[]): RecordStatus => {
  if (domain.status === 'verified') return 'verified'
  if (pills.some((pill) => pill.state === 'match')) return 'pending'
  return 'not_found'
}

export const loadDomainPageData = async (
  userId: string,
  domainId: string,
): Promise<DomainPageData | null> => {
  let detail
  try {
    detail = await getDomainDetail(userId, domainId)
  } catch (error) {
    if (error instanceof DomainNotFoundError) return null
    throw error
  }
  const domain = toDomainView(detail.domain)
  const checks = detail.checks.map(toCheckView)
  const latestCheck = checks[0] ?? null
  const pills = deriveSourcePills(latestCheck, detail.record.value)
  const diagnosis = deriveDiagnosis(domain, latestCheck, detail.record.value)
  const recordStatus = deriveRecordStatus(domain, pills)
  return { domain, checks, record: detail.record, latestCheck, diagnosis, recordStatus }
}
