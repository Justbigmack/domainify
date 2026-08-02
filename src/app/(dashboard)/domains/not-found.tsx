import { SearchXIcon } from 'lucide-react'
import { PageState } from '@/components/brand/PageState'
import { PrimaryButton } from '@/components/brand/PrimaryButton'

const DomainNotFound = () => (
  <PageState
    icon={SearchXIcon}
    title="Domain not found"
    action={
      <PrimaryButton href="/domains">Back to domains</PrimaryButton>
    }
  >
    That domain doesn’t exist, or it belongs to a different account.
  </PageState>
)

export default DomainNotFound
