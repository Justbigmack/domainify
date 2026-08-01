import type { PropsWithChildren, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

type AlertBannerTone = 'info' | 'success' | 'destructive'

const TONE_CLASSES: Record<AlertBannerTone, string> = {
  info: 'border-info/20 bg-info/[0.06] text-info',
  success: 'border-success/20 bg-success-subtle text-success',
  destructive: 'border-destructive/20 bg-destructive/[0.06] text-destructive',
}

type AlertBannerProps = PropsWithChildren<{
  tone: AlertBannerTone
  icon: LucideIcon
  action?: ReactNode
  className?: string
}>

export const AlertBanner = ({ tone, icon: Icon, action, className, children }: AlertBannerProps) => (
  <Alert
    className={cn(
      'flex items-start gap-3 rounded-lg px-5 *:[svg]:translate-y-0',
      TONE_CLASSES[tone],
      className,
    )}
  >
    <Icon className="mt-0.5 size-4 shrink-0" />
    <div className="flex-1">{children}</div>
    {action}
  </Alert>
)
