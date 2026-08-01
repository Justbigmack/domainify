import { SearchXIcon } from 'lucide-react'
import { AlertBanner } from '@/components/brand/AlertBanner'
import { GhostButton } from '@/components/brand/GhostButton'

const DomainNotFound = () => (
  <div className="mx-auto flex w-full max-w-6xl flex-col px-6 py-8 lg:px-10">
    <AlertBanner
      tone="info"
      icon={SearchXIcon}
      action={<GhostButton href="/domains">Back to domains</GhostButton>}
    >
      That domain doesn&apos;t exist, or it belongs to a different account.
    </AlertBanner>
  </div>
)

export default DomainNotFound
