import { GlobeIcon } from 'lucide-react'
import { BreadcrumbLink } from '@/components/brand/BreadcrumbLink'
import { Text } from '@/components/brand/Text'
import { Skeleton } from '@/components/ui/skeleton'

export const DomainHeaderSkeleton = () => (
  <header className="flex flex-col px-5">
    <div className="flex min-h-9 items-center justify-between gap-4">
      <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5">
        <BreadcrumbLink href="/domains" label="Domains" icon={GlobeIcon} />
        <Text as="span" className="text-[0.8125rem] text-muted-foreground/60" aria-hidden>
          /
        </Text>
        <Skeleton className="h-3.5 w-40" />
      </nav>
      <div className="-mr-3.5 flex h-8 shrink-0 items-center px-3">
        <Skeleton className="h-3.5 w-8" />
      </div>
    </div>
    <div className="mt-6 flex size-12 shrink-0 items-center justify-center rounded-xl border bg-background shadow-xs">
      <GlobeIcon aria-hidden strokeWidth={1.5} className="size-6 text-muted-foreground" />
    </div>
    <div className="mt-4 flex h-9 items-center gap-2">
      <Skeleton className="h-5 w-56" />
      <Skeleton className="h-5 w-20 rounded-full" />
    </div>
    <div className="mt-1 flex h-5 items-center">
      <Skeleton className="h-3.5 w-64" />
    </div>
  </header>
)
