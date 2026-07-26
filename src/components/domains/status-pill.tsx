import { cn } from '@/lib/cn'
import type { DomainStatus } from '@/lib/domains/status'

type StatusConfig = {
  label: string
  pillClassName: string
  dotClassName: string
}

const STATUS_CONFIG: Record<DomainStatus, StatusConfig> = {
  pending: {
    label: 'Pending',
    pillClassName: 'bg-info-soft text-info',
    dotClassName: 'bg-info',
  },
  verified: {
    label: 'Verified',
    pillClassName: 'bg-success-soft text-success',
    dotClassName: 'bg-success',
  },
  temporary_failure: {
    label: 'Record missing',
    pillClassName: 'bg-warning-soft text-warning',
    dotClassName: 'bg-warning',
  },
  failed: {
    label: 'Failed',
    pillClassName: 'bg-danger-soft text-danger',
    dotClassName: 'bg-danger',
  },
}

type StatusPillProps = {
  status: DomainStatus
  detail?: string | null
}

export const StatusPill = ({ status, detail }: StatusPillProps) => {
  const config = STATUS_CONFIG[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap',
        config.pillClassName,
      )}
    >
      <span className={cn('size-1.5 shrink-0 rounded-full', config.dotClassName)} />
      {config.label}
      {detail ? <span className="opacity-80">· {detail}</span> : null}
    </span>
  )
}
