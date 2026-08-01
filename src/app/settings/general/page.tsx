import type { Metadata } from 'next'
import { SettingsRow, SettingsSection } from '@/app/settings/_components/SettingsSection'
import { ThemeSelect } from '@/app/settings/_components/ThemeSelect'
import { Heading } from '@/components/brand/Heading'

export const metadata: Metadata = {
  title: 'General · Settings',
}

const GeneralSettingsPage = () => (
  <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-8 lg:px-10">
    <header className="pl-5">
      <Heading as="h1">General</Heading>
    </header>
    <SettingsSection
      title="Appearance"
      description="How the dashboard looks for you. Changes apply instantly."
    >
      <SettingsRow title="Theme" description="Switch between light and dark mode.">
        <ThemeSelect />
      </SettingsRow>
    </SettingsSection>
  </div>
)

export default GeneralSettingsPage
