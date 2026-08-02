import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { DomainStatus, RecordStatus } from '@/lib/domains/model/status'

type StatusTagStatus = DomainStatus | RecordStatus

type StatusConfig = {
  label: string
  badgeClassName: string
}

const STATUS_CONFIG: Record<StatusTagStatus, StatusConfig> = {
  pending: {
    label: 'Pending',
    badgeClassName: 'bg-info/10 text-info',
  },
  verified: {
    label: 'Verified',
    badgeClassName: 'bg-success-subtle text-success',
  },
  temporary_failure: {
    label: 'Record missing',
    badgeClassName: 'bg-destructive/10 text-destructive',
  },
  failed: {
    label: 'Failed',
    badgeClassName: 'bg-destructive/10 text-destructive',
  },
  not_found: {
    label: 'Not found',
    badgeClassName: 'bg-muted text-muted-foreground',
  },
}

type StatusTagProps = {
  status: StatusTagStatus
  className?: string
}

export const StatusTag = ({ status, className }: StatusTagProps) => {
  const config = STATUS_CONFIG[status]
  return (
    <Badge
      variant="outline"
      className={cn('-ml-2 border-transparent', config.badgeClassName, className)}
    >
      {config.label}
    </Badge>
  )
}
