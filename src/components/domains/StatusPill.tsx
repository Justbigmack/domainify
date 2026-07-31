import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { DomainStatus } from '@/lib/domains/status'

type StatusConfig = {
  label: string
  badgeClassName: string
}

const STATUS_CONFIG: Record<DomainStatus, StatusConfig> = {
  pending: {
    label: 'Pending',
    badgeClassName: 'bg-info/10 text-info',
  },
  verified: {
    label: 'Verified',
    badgeClassName: 'bg-success/10 text-success',
  },
  temporary_failure: {
    label: 'Record missing',
    badgeClassName: 'bg-warning/10 text-warning',
  },
  failed: {
    label: 'Failed',
    badgeClassName: 'bg-destructive/10 text-destructive',
  },
}

type StatusPillProps = {
  status: DomainStatus
  detail?: string | null
  className?: string
}

export const StatusPill = ({ status, detail, className }: StatusPillProps) => {
  const config = STATUS_CONFIG[status]
  return (
    <Badge
      variant="outline"
      className={cn('-ml-2 border-transparent', config.badgeClassName, className)}
    >
      {config.label}
      {detail ? <span className="opacity-80">· {detail}</span> : null}
    </Badge>
  )
}
