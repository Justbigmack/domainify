import { ChevronDownIcon } from 'lucide-react'
import { CopyButton } from '@/components/brand/CopyButton'
import { Text } from '@/components/brand/Text'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

type TerminalCheckProps = {
  challengeHost: string
}

export const TerminalCheck = ({ challengeHost }: TerminalCheckProps) => {
  const digCommand = `dig TXT ${challengeHost} +short`
  return (
    <Collapsible className="mt-2 flex flex-col items-start">
      <CollapsibleTrigger className="group flex w-fit cursor-pointer items-center gap-1.5 rounded-sm text-[0.8125rem] font-medium text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50">
        Check it yourself from a terminal
        <ChevronDownIcon className="size-4 transition-transform duration-200 ease-out group-data-panel-open:rotate-180 motion-reduce:transition-none" />
      </CollapsibleTrigger>
      <CollapsibleContent className="self-stretch">
        <div className="flex flex-col gap-2 pt-2">
          <div className="flex items-center gap-1 rounded-lg bg-muted px-3 py-2">
            <code className="min-w-0 overflow-x-auto font-mono text-xs whitespace-nowrap">
              {digCommand}
            </code>
            <CopyButton value={digCommand} label="Copy dig command" className="text-muted-foreground" />
          </div>
          <Text variant="caption" className="leading-5">
            An empty answer means the record isn&apos;t live yet. Your terminal asks a cached
            resolver, so it can lag a minute behind what we see at your nameservers.
          </Text>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
