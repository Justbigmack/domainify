import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '@/lib/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost'

const BASE_CLASSES =
  'inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:pointer-events-none disabled:opacity-60'

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-primary-ink hover:bg-primary/85',
  secondary: 'border border-border bg-surface text-ink hover:bg-surface-muted',
  ghost: 'text-ink-muted hover:bg-surface-muted hover:text-ink',
}

export const buttonClassName = (variant: ButtonVariant): string =>
  cn(BASE_CLASSES, VARIANT_CLASSES[variant])

type ButtonProps = ComponentPropsWithoutRef<'button'> & {
  variant?: ButtonVariant
}

export const Button = ({ variant = 'primary', className, type = 'button', ...props }: ButtonProps) => (
  <button type={type} className={cn(buttonClassName(variant), className)} {...props} />
)
