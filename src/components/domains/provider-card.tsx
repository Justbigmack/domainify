import { ExternalLinkIcon } from '@/components/icons'
import { DNS_PROVIDERS } from '@/lib/dns/providers'

type ProviderCardProps = {
  providerId: string | null
}

export const ProviderCard = ({ providerId }: ProviderCardProps) => {
  const provider = DNS_PROVIDERS.find((entry) => entry.id === providerId)
  if (!provider) return null
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface-muted/40 px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium">Your DNS is on {provider.displayName}</p>
        <p className="mt-0.5 text-xs leading-5 text-ink-muted">{provider.hostFieldHint}</p>
      </div>
      <a
        href={provider.dashboardUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        Open dashboard
        <ExternalLinkIcon className="size-3.5" />
      </a>
    </div>
  )
}
