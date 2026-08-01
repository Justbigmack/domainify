import type { PropsWithChildren } from 'react'
import { Heading } from '@/components/brand/Heading'
import { Text } from '@/components/brand/Text'

type SettingsSectionProps = PropsWithChildren<{
  title: string
  description: string
}>

export const SettingsSection = ({ title, description, children }: SettingsSectionProps) => (
  <section className="flex flex-col gap-3">
    <header className="flex flex-col gap-0.5 pl-5">
      <Heading as="h2" size="h3">
        {title}
      </Heading>
      <Text className="text-muted-foreground">{description}</Text>
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
      <Heading as="h3" size="h4">
        {title}
      </Heading>
      <Text className="text-muted-foreground">{description}</Text>
    </div>
    <div className="shrink-0">{children}</div>
  </div>
)
