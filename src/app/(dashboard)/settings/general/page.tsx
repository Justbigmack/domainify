import type { Metadata } from 'next'
import { SettingsRow, SettingsSection } from '@/app/(dashboard)/settings/_components/SettingsSection'
import { ThemeSelect } from '@/app/(dashboard)/settings/_components/ThemeSelect'
import { Heading } from '@/components/brand/Heading'

export const metadata: Metadata = {
  title: 'General · Settings',
}

const GeneralSettingsPage = () => (
  <>
    <header className="flex min-h-9 items-center pl-5">
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
  </>
)

export default GeneralSettingsPage
