import type { PropsWithChildren } from 'react'
import { PageContainer } from '@/components/brand/PageContainer'

const SettingsLayout = ({ children }: PropsWithChildren) => (
  <PageContainer width="narrow" gap="lg" height="fill">
    {children}
  </PageContainer>
)

export default SettingsLayout
