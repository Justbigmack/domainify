import type { PropsWithChildren } from 'react'
import { InfoIcon } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type CalloutTone = 'info'

const TONE_CLASSES: Record<CalloutTone, string> = {
  info: 'border-info/20 bg-info/[0.06] text-info',
}

const TONE_ICONS: Record<CalloutTone, LucideIcon> = {
  info: InfoIcon,
}

type CalloutProps = PropsWithChildren<{
  tone?: CalloutTone
  className?: string
}>

export const Callout = ({ tone = 'info', className, children }: CalloutProps) => {
  const Icon = TONE_ICONS[tone]
  return (
    <div
      role="note"
      className={cn('flex items-start gap-3 rounded-lg border px-4 py-3', TONE_CLASSES[tone], className)}
    >
      <Icon aria-hidden className="mt-1 size-4 shrink-0" />
      <div className="flex-1 text-[0.8125rem] leading-6">{children}</div>
    </div>
  )
}
