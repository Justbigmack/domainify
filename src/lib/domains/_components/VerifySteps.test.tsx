import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type * as ProviderSelectModule from './ProviderSelect'
import { VerifySteps } from './VerifySteps'

const PROVIDER_LABEL = 'DNS provider'

vi.mock('@/lib/domains/actions', () => ({
  pollDomainAction: vi.fn(() => Promise.resolve({ ok: true })),
  verifyDomainAction: vi.fn(() => Promise.resolve({ ok: true })),
}))

vi.mock('./ProviderSelect', async (importOriginal) => {
  const actual = await importOriginal<typeof ProviderSelectModule>()
  const { DNS_PROVIDERS } = await import('@/lib/dns/providers')
  const providerIds = [actual.OTHER_PROVIDER_ID, ...DNS_PROVIDERS.map((provider) => provider.id)]
  const ProviderSelect = ({ value, onValueChange }: ProviderSelectModule.ProviderSelectProps) => (
    <select
      aria-label={PROVIDER_LABEL}
      value={value}
      onChange={(event) => onValueChange(event.target.value)}
    >
      {providerIds.map((providerId) => (
        <option key={providerId} value={providerId}>
          {providerId}
        </option>
      ))}
    </select>
  )
  return { ...actual, ProviderSelect }
})

const DOMAIN_PROPS = {
  domainId: 'domain-1',
  recordValue: 'domainify-domain-verification=token',
  recordName: '_domainify-challenge',
  challengeHost: '_domainify-challenge.example.com',
  registrableDomain: 'example.com',
}

const selectedProvider = () => screen.getByLabelText(PROVIDER_LABEL)

describe('VerifySteps', () => {
  it('falls back to the generic record fields while no provider is known', () => {
    render(<VerifySteps {...DOMAIN_PROPS} detectedProviderId={null} />)

    expect(selectedProvider()).toHaveValue('other')
    expect(screen.getByText('Host')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Open dashboard' })).not.toBeInTheDocument()
  })

  it('adopts a provider the server detects after the first render', () => {
    const { rerender } = render(<VerifySteps {...DOMAIN_PROPS} detectedProviderId={null} />)

    rerender(<VerifySteps {...DOMAIN_PROPS} detectedProviderId="cloudflare" />)

    expect(selectedProvider()).toHaveValue('cloudflare')
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Content')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Open dashboard' })).toHaveAttribute(
      'href',
      'https://dash.cloudflare.com/?to=/:account/example.com/dns',
    )
  })

  it('keeps the provider the reader picked when detection lands later', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<VerifySteps {...DOMAIN_PROPS} detectedProviderId={null} />)

    await user.selectOptions(selectedProvider(), 'namecheap')
    rerender(<VerifySteps {...DOMAIN_PROPS} detectedProviderId="cloudflare" />)

    expect(selectedProvider()).toHaveValue('namecheap')
    expect(screen.getByText('Host')).toBeInTheDocument()
  })
})
