import Link from 'next/link'
import { SearchXIcon } from 'lucide-react'
import { PageState } from '@/components/brand/PageState'
import { Button } from '@/components/ui/button'

const DomainNotFound = () => (
  <PageState
    icon={SearchXIcon}
    title="Domain not found"
    action={
      <Button nativeButton={false} render={<Link href="/domains" />}>
        Back to domains
      </Button>
    }
  >
    That domain doesn’t exist, or it belongs to a different account.
  </PageState>
)

export default DomainNotFound
