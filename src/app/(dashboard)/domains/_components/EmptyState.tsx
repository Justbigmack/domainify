import { GlobeIcon, PlusIcon } from 'lucide-react'
import { PrimaryButton } from '@/components/brand/PrimaryButton'
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
      <PrimaryButton icon={PlusIcon} href="/domains/add">
        Add domain
      </PrimaryButton>
    </EmptyContent>
  </Empty>
)
