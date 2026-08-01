import type { PropsWithChildren } from 'react'
import type { LucideIcon } from 'lucide-react'
import { GhostButton } from '@/components/brand/GhostButton'

type AlertBannerActionProps = PropsWithChildren<{
  icon?: LucideIcon
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
}>

export const AlertBannerAction = ({
  icon,
  onClick,
  disabled = false,
  loading = false,
  children,
}: AlertBannerActionProps) => (
  <GhostButton
    icon={icon}
    onClick={onClick}
    disabled={disabled}
    loading={loading}
    className="-my-1 -mr-2.5 self-center text-current hover:bg-current/10 hover:text-current focus-visible:ring-current/20"
  >
    {children}
  </GhostButton>
)
