import { ChevronDownIcon } from 'lucide-react'
import { CopyButton } from '@/components/ui/copy-button'

type TerminalCheckProps = {
  challengeHost: string
}

export const TerminalCheck = ({ challengeHost }: TerminalCheckProps) => {
  const digCommand = `dig TXT ${challengeHost} +short`
  return (
    <details className="group mt-2">
      <summary className="flex w-fit cursor-pointer items-center gap-1.5 rounded-sm text-[0.8125rem] font-medium text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
        Check it yourself from a terminal
        <ChevronDownIcon className="size-4 transition-transform group-open:rotate-180" />
      </summary>
      <div className="mt-2 flex flex-col gap-2">
        <div className="flex items-center gap-1 rounded-lg bg-muted px-3 py-2">
          <code className="min-w-0 overflow-x-auto font-mono text-xs whitespace-nowrap">
            {digCommand}
          </code>
          <CopyButton value={digCommand} label="Copy dig command" className="text-muted-foreground" />
        </div>
        <p className="text-xs leading-5 text-muted-foreground">
          An empty answer means the record isn&apos;t live yet. Your terminal asks a cached
          resolver, so it can lag a minute behind what we see at your nameservers.
        </p>
      </div>
    </details>
  )
}
