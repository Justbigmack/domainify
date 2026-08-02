import type { PropsWithChildren, ReactElement } from 'react'
import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

export type ActionButtonProps = PropsWithChildren<{
  icon?: LucideIcon
  iconPosition?: 'leading' | 'trailing'
  size?: 'sm' | 'default' | 'lg'
  type?: 'button' | 'submit'
  loading?: boolean
  disabled?: boolean
  onClick?: () => void
  href?: string
  isExternal?: boolean
  className?: string
}>

type InternalActionButtonProps = ActionButtonProps & {
  variant: 'default' | 'outline'
}

export const ActionButton = ({
  variant,
  icon,
  iconPosition = 'leading',
  size = 'default',
  type = 'button',
  loading = false,
  disabled = false,
  onClick,
  href,
  isExternal = false,
  className,
  children,
}: InternalActionButtonProps) => {
  const isLink = href !== undefined
  let linkElement: ReactElement | undefined
  if (href !== undefined) {
    linkElement = isExternal ? (
      <a href={href} target="_blank" rel="noreferrer" />
    ) : (
      <Link href={href} />
    )
  }
  const LeadingIcon = iconPosition === 'leading' ? icon : undefined
  const TrailingIcon = iconPosition === 'trailing' ? icon : undefined

  return (
    <Button
      variant={variant}
      size={size}
      type={isLink ? undefined : type}
      onClick={onClick}
      loading={loading}
      disabled={disabled}
      nativeButton={!isLink}
      render={linkElement}
      className={className}
    >
      {LeadingIcon && <LeadingIcon data-icon="inline-start" />}
      {children}
      {TrailingIcon && <TrailingIcon data-icon="inline-end" />}
    </Button>
  )
}
