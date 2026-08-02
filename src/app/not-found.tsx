import { FileQuestionMarkIcon } from 'lucide-react'
import { PageState } from '@/components/brand/PageState'
import { PrimaryButton } from '@/components/brand/PrimaryButton'

const NotFound = () => (
  <PageState
    height="viewport"
    icon={FileQuestionMarkIcon}
    title="Page not found"
    action={
      <PrimaryButton href="/domains">Go to domains</PrimaryButton>
    }
  >
    This page doesn’t exist. It may have been moved, or the link that brought you here is out of
    date.
  </PageState>
)

export default NotFound
