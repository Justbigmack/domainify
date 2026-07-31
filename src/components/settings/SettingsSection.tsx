import type { PropsWithChildren } from 'react'

type SettingsSectionProps = PropsWithChildren<{
  title: string
  description: string
}>

export const SettingsSection = ({ title, description, children }: SettingsSectionProps) => (
  <section className="flex flex-col gap-3">
    <header className="flex flex-col gap-0.5 pl-5">
      <h2 className="text-sm font-semibold">{title}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>
    </header>
    <div className="flex flex-col divide-y divide-border/50 rounded-xl border border-border/50 bg-card">
      {children}
    </div>
  </section>
)

type SettingsRowProps = PropsWithChildren<{
  title: string
  description: string
}>

export const SettingsRow = ({ title, description, children }: SettingsRowProps) => (
  <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
    <div className="flex flex-col gap-0.5">
      <h3 className="text-sm font-medium">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
    <div className="shrink-0">{children}</div>
  </div>
)
