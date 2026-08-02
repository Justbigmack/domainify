import Link from 'next/link'
import { FileQuestionMarkIcon } from 'lucide-react'
import { PageState } from '@/components/brand/PageState'
import { Button } from '@/components/ui/button'

const NotFound = () => (
  <PageState
    height="viewport"
    icon={FileQuestionMarkIcon}
    title="Page not found"
    action={
      <Button nativeButton={false} render={<Link href="/domains" />}>
        Go to domains
      </Button>
    }
  >
    This page doesn’t exist. It may have been moved, or the link that brought you here is out of
    date.
  </PageState>
)

export default NotFound
