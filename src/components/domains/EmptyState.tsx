import Link from 'next/link'
import { GlobeIcon, PlusIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'

export const EmptyState = () => (
  <Empty className="border bg-card py-20">
    <EmptyHeader>
      <EmptyMedia variant="icon">
        <GlobeIcon />
      </EmptyMedia>
      <EmptyTitle>No domains yet</EmptyTitle>
      <EmptyDescription>
        Add a domain and prove you own it with a single DNS TXT record.
      </EmptyDescription>
    </EmptyHeader>
    <EmptyContent>
      <Button nativeButton={false} render={<Link href="/domains/add" />}>
        <PlusIcon data-icon="inline-start" />
        Add domain
      </Button>
    </EmptyContent>
  </Empty>
)
