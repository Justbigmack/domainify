import { SearchXIcon } from 'lucide-react'
import { AlertBanner } from '@/components/brand/AlertBanner'
import { GhostButton } from '@/components/brand/GhostButton'
import { PageContainer } from '@/components/brand/PageContainer'

const DomainNotFound = () => (
  <PageContainer gap="none">
    <AlertBanner
      tone="info"
      icon={SearchXIcon}
      action={<GhostButton href="/domains">Back to domains</GhostButton>}
    >
      That domain doesn&apos;t exist, or it belongs to a different account.
    </AlertBanner>
  </PageContainer>
)

export default DomainNotFound
