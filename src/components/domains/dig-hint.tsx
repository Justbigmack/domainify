import { ChevronDownIcon } from '@/components/icons'
import { CopyButton } from '@/components/ui/copy-button'

type DigHintProps = {
  challengeHost: string
}

export const DigHint = ({ challengeHost }: DigHintProps) => {
  const digCommand = `dig TXT ${challengeHost} +short`
  return (
    <details className="group rounded-xl border border-border bg-surface">
      <summary className="flex cursor-pointer items-center justify-between gap-2 px-4 py-3 text-sm font-medium text-ink-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus [&::-webkit-details-marker]:hidden">
        Check it yourself from a terminal
        <ChevronDownIcon className="size-4 transition-transform group-open:rotate-180" />
      </summary>
      <div className="border-t border-border px-4 py-3">
        <div className="flex items-center justify-between gap-2 rounded-lg bg-surface-muted px-3 py-2">
          <code className="min-w-0 overflow-x-auto font-mono text-xs whitespace-nowrap">
            {digCommand}
          </code>
          <CopyButton value={digCommand} label="Copy dig command" />
        </div>
        <p className="mt-2 text-xs leading-5 text-ink-subtle">
          An empty answer means the record isn&apos;t live yet. Your terminal asks a cached
          resolver, so it can lag a minute behind what we see at your nameservers.
        </p>
      </div>
    </details>
  )
}
