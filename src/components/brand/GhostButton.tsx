import type { PropsWithChildren, ReactElement } from 'react'
import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'

type GhostButtonProps = PropsWithChildren<{
  icon?: LucideIcon
  variant?: 'default' | 'destructive'
  size?: 'xs' | 'sm' | 'default'
  iconPosition?: 'leading' | 'trailing'
  loading?: boolean
  disabled?: boolean
  onClick?: () => void
  href?: string
  isExternal?: boolean
  className?: string
}>

export const GhostButton = ({
  icon,
  variant = 'default',
  size = 'sm',
  iconPosition = 'leading',
  loading = false,
  disabled = false,
  onClick,
  href,
  isExternal = false,
  className,
  children,
}: GhostButtonProps) => {
  const isDestructive = variant === 'destructive'
  const isLink = href !== undefined
  let linkElement: ReactElement | undefined
  if (href !== undefined) {
    linkElement = isExternal ? <a href={href} target="_blank" rel="noreferrer" /> : <Link href={href} />
  }
  const LeadingIcon = iconPosition === 'leading' && !loading ? icon : undefined
  const TrailingIcon = iconPosition === 'trailing' && !loading ? icon : undefined
  const showsLeadingSpinner = iconPosition === 'leading' && loading
  const showsTrailingSpinner = iconPosition === 'trailing' && loading

  return (
    <Button
      variant="ghost"
      size={size}
      onClick={onClick}
      disabled={disabled || loading}
      nativeButton={!isLink}
      render={linkElement}
      className={cn(
        'font-normal',
        {
          'text-muted-foreground': !isDestructive,
          'text-destructive/80 hover:bg-destructive/10 hover:text-destructive focus-visible:ring-destructive/20':
            isDestructive,
        },
        className,
      )}
    >
      {showsLeadingSpinner && <Spinner data-icon="inline-start" />}
      {LeadingIcon && <LeadingIcon data-icon="inline-start" />}
      {children}
      {TrailingIcon && <TrailingIcon data-icon="inline-end" />}
      {showsTrailingSpinner && <Spinner data-icon="inline-end" />}
    </Button>
  )
}
