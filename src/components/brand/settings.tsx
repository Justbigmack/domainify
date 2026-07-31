import type { ComponentProps, ElementType, HTMLAttributes, PropsWithChildren, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { GhostButton } from '@/components/brand/ghost-button'
import { Alert as UiAlert } from '@/components/ui/alert'
import { Label as UiLabel } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export const settingsType = {
  pageTitle: 'text-2xl font-semibold',
  sectionTitle: 'text-sm font-medium tabular-nums',
  label: 'text-sm leading-normal font-medium',
  body: 'text-[0.8125rem] tabular-nums',
  tableHead: 'text-xs font-medium',
} as const

export type SettingsTextVariant = keyof typeof settingsType

export const SETTINGS_TABLE_HEAD_TEXT_CLASS = cn(settingsType.tableHead, 'text-muted-foreground/80')
export const SETTINGS_TABLE_HEAD_CLASS = cn('h-9 px-5', SETTINGS_TABLE_HEAD_TEXT_CLASS)
export const SETTINGS_TABLE_CELL_CLASS = 'px-5 py-3.5 text-sm'

export const settingsTableRowClass = (isLastRow: boolean) =>
  cn('hover:bg-transparent', { 'border-b-0': isLastRow, 'border-border/40': !isLastRow })

type SettingsPartProps = PropsWithChildren<{ className?: string }>

const Root = ({ className, children }: SettingsPartProps) => (
  <section className={cn('flex flex-col gap-3', className)}>{children}</section>
)

const Header = ({ className, children }: SettingsPartProps) => (
  <div
    className={cn(
      'grid auto-rows-min grid-rows-[auto_auto] items-start gap-0.5 px-5 has-data-[slot=settings-action]:grid-cols-[1fr_auto]',
      className,
    )}
  >
    {children}
  </div>
)

const Content = ({ className, children }: SettingsPartProps) => (
  <div className={cn('overflow-hidden rounded-xl border border-border/50 bg-card', className)}>
    {children}
  </div>
)

const Toolbar = ({ className, children }: SettingsPartProps) => (
  <div
    className={cn(
      'flex items-center justify-between gap-4 border-b border-border/50 px-5 py-3',
      className,
    )}
  >
    {children}
  </div>
)

type SettingsTextProps = HTMLAttributes<HTMLElement> & {
  variant: SettingsTextVariant
  as?: ElementType
}

const Text = ({ variant, as: Tag = 'span', className, ...props }: SettingsTextProps) => (
  <Tag className={cn(settingsType[variant], className)} {...props} />
)

const Title = ({ className, children }: SettingsPartProps) => (
  <Text variant="sectionTitle" as="h2" className={className}>
    {children}
  </Text>
)

type SettingsDescriptionProps = PropsWithChildren<{
  tone?: 'default' | 'destructive'
  className?: string
}>

const Description = ({ tone = 'default', className, children }: SettingsDescriptionProps) => (
  <Text
    variant="body"
    as="div"
    className={cn(
      {
        'text-muted-foreground': tone === 'default',
        'text-destructive/80': tone === 'destructive',
      },
      className,
    )}
  >
    {children}
  </Text>
)

const Action = ({ className, children }: SettingsPartProps) => (
  <div
    data-slot="settings-action"
    className={cn('col-start-2 row-span-2 row-start-1 shrink-0 justify-self-end', className)}
  >
    {children}
  </div>
)

type SettingsRowProps = PropsWithChildren<{
  layout?: 'inline' | 'stacked'
  alignment?: 'center' | 'top'
  density?: 'default' | 'compact'
  className?: string
}>

const Row = ({
  layout = 'inline',
  alignment = 'center',
  density = 'default',
  className,
  children,
}: SettingsRowProps) => {
  const isStacked = layout === 'stacked'
  return (
    <div
      data-layout={layout}
      className={cn(
        'group/settings-row px-5',
        {
          'py-3.5': density === 'default',
          'py-2.5': density === 'compact',
          'flex justify-between gap-4': !isStacked,
          'items-center': !isStacked && alignment === 'center',
          'items-start': !isStacked && alignment === 'top',
          'flex flex-col gap-1.5': isStacked,
        },
        className,
      )}
    >
      {children}
    </div>
  )
}

const RowText = ({ className, children }: SettingsPartProps) => (
  <div
    className={cn('min-w-0 flex-1 group-data-[layout=inline]/settings-row:max-w-[65%]', className)}
  >
    {children}
  </div>
)

const RowControl = ({ className, children }: SettingsPartProps) => (
  <div className={cn('flex w-full max-w-[35%] flex-col items-end', className)}>{children}</div>
)

const Label = ({ className, ...props }: ComponentProps<typeof UiLabel>) => (
  <UiLabel className={cn(settingsType.label, 'gap-1.5', className)} {...props} />
)

type SettingsDividerProps = {
  fullBleed?: boolean
  className?: string
}

const Divider = ({ fullBleed = false, className }: SettingsDividerProps) => (
  <hr className={cn('border-0 border-t border-border/50', { 'mx-5': !fullBleed }, className)} />
)

type SettingsAlertTone = 'info' | 'warning' | 'destructive'

const ALERT_TONE_CLASSES: Record<SettingsAlertTone, string> = {
  info: 'border-info/20 bg-info/[0.06] text-info',
  warning: 'border-warning/20 bg-warning/[0.06] text-warning',
  destructive: 'border-destructive/20 bg-destructive/[0.06] text-destructive',
}

type SettingsAlertProps = PropsWithChildren<{
  tone: SettingsAlertTone
  icon: LucideIcon
  action?: ReactNode
  className?: string
}>

const Alert = ({ tone, icon: Icon, action, className, children }: SettingsAlertProps) => (
  <UiAlert
    className={cn(
      'flex items-start gap-3 rounded-lg px-5 *:[svg]:translate-y-0',
      ALERT_TONE_CLASSES[tone],
      className,
    )}
  >
    <Icon className="mt-0.5 size-4 shrink-0" />
    <div className="flex-1">{children}</div>
    {action}
  </UiAlert>
)

type SettingsAlertActionProps = PropsWithChildren<{
  icon?: LucideIcon
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
}>

const AlertAction = ({
  icon,
  onClick,
  disabled = false,
  loading = false,
  children,
}: SettingsAlertActionProps) => (
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

export const Settings = {
  Root,
  Header,
  Content,
  Toolbar,
  Text,
  Title,
  Description,
  Action,
  Row,
  RowText,
  RowControl,
  Label,
  Divider,
  Alert,
  AlertAction,
}
