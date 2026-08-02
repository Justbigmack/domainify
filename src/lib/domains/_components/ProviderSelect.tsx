'use client'

import Image from 'next/image'
import { GlobeIcon } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DNS_PROVIDERS } from '@/lib/dns/providers'
import type { DnsProvider } from '@/lib/dns/providers'

export const OTHER_PROVIDER_ID = 'other'

const LOGO_RENDER_SIZE = 16
const LOGO_FETCH_SIZE = 32

export const findDnsProvider = (providerId: string): DnsProvider | null =>
  DNS_PROVIDERS.find((entry) => entry.id === providerId) ?? null

const PROVIDER_ITEMS = [
  ...DNS_PROVIDERS.map((provider) => ({ value: provider.id, label: provider.displayName })),
  { value: OTHER_PROVIDER_ID, label: 'Other / not sure' },
]

const ProviderLogo = ({ provider }: { provider: DnsProvider | null }) => {
  if (!provider) return <GlobeIcon className="size-4 shrink-0 text-muted-foreground" />
  return (
    <Image
      src={`https://www.google.com/s2/favicons?domain=${provider.logoDomain}&sz=${LOGO_FETCH_SIZE}`}
      alt=""
      width={LOGO_RENDER_SIZE}
      height={LOGO_RENDER_SIZE}
      className="size-4 shrink-0 rounded-xs"
    />
  )
}

export type ProviderSelectProps = {
  value: string
  onValueChange: (providerId: string) => void
  id?: string
}

export const ProviderSelect = ({ value, onValueChange, id }: ProviderSelectProps) => {
  const handleValueChange = (nextValue: string | null) => {
    if (nextValue) onValueChange(nextValue)
  }

  return (
    <Select items={PROVIDER_ITEMS} value={value} onValueChange={handleValueChange}>
      <SelectTrigger id={id} size="sm">
        <ProviderLogo provider={findDnsProvider(value)} />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {PROVIDER_ITEMS.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              <ProviderLogo provider={findDnsProvider(item.value)} />
              {item.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
