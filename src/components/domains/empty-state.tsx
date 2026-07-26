import Link from 'next/link'
import { GlobeIcon, PlusIcon } from '@/components/icons'
import { buttonClassName } from '@/components/ui/button'
import { cn } from '@/lib/cn'

export const EmptyState = () => (
  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border-strong bg-surface px-6 py-20 text-center">
    <div className="flex size-12 items-center justify-center rounded-full bg-surface-muted text-ink-subtle">
      <GlobeIcon className="size-6" />
    </div>
    <h2 className="mt-4 text-base font-semibold tracking-tight">No domains yet</h2>
    <p className="mt-1 max-w-sm text-sm leading-6 text-ink-muted">
      Add a domain and prove you own it with a single DNS TXT record.
    </p>
    <Link href="/domains/add" className={cn(buttonClassName('primary'), 'mt-6')}>
      <PlusIcon className="size-4" />
      Add domain
    </Link>
  </div>
)
