'use client'

import { useActionState, useState } from 'react'
import type { ChangeEvent } from 'react'
import { Button } from '@/components/ui/button'
import { normalizeDomainInput } from '@/lib/dns/normalize'
import { createDomainAction } from '@/lib/domains/actions'

const WWW_PREFIX = 'www.'

export const AddDomainForm = () => {
  const [inputValue, setInputValue] = useState('')
  const [hasBlurred, setHasBlurred] = useState(false)
  const [state, formAction, isPending] = useActionState(createDomainAction, null)

  const normalized = normalizeDomainInput(inputValue)
  const hasInput = inputValue.trim().length > 0
  const parsedDomain = normalized.ok ? normalized.domain : null
  const apexAlternative =
    parsedDomain && parsedDomain.hostname.startsWith(WWW_PREFIX)
      ? parsedDomain.hostname.slice(WWW_PREFIX.length)
      : null
  const clientError = hasBlurred && hasInput && !normalized.ok ? normalized.error : null
  const serverError = state?.error ?? null

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value)
    setHasBlurred(false)
  }

  const handleInputBlur = () => {
    setHasBlurred(true)
  }

  const handleUseApex = () => {
    if (apexAlternative) setInputValue(apexAlternative)
  }

  return (
    <form action={formAction} className="flex max-w-lg flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="domain-name" className="text-sm font-medium">
          Domain name
        </label>
        <input
          id="domain-name"
          name="name"
          type="text"
          required
          autoFocus
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="example.com"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          className="h-11 rounded-lg border border-border bg-surface px-3 font-mono text-base text-ink placeholder:font-sans placeholder:text-ink-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        />
        <p className="text-xs leading-5 text-ink-subtle">
          Paste anything — a full URL works. We&apos;ll extract the domain.
        </p>
      </div>
      {parsedDomain && (
        <div className="flex flex-col gap-2 rounded-xl border border-border bg-surface-muted/40 px-4 py-3 text-sm">
          <p>
            You&apos;re claiming <strong className="font-mono font-semibold">{parsedDomain.hostname}</strong>
            {!parsedDomain.isApex && (
              <span className="text-ink-muted"> — a subdomain of {parsedDomain.registrableDomain}</span>
            )}
          </p>
          <p className="text-ink-muted">
            We&apos;ll ask you to create a TXT record at{' '}
            <code className="font-mono text-xs break-all">{parsedDomain.challengeHost}</code>
          </p>
          {apexAlternative && (
            <button
              type="button"
              onClick={handleUseApex}
              className="self-start rounded-md text-sm font-medium text-info underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              Claim {apexAlternative} instead
            </button>
          )}
        </div>
      )}
      {clientError && (
        <p role="alert" className="text-sm leading-6 text-danger">
          {clientError.message}
        </p>
      )}
      {serverError && (
        <p role="alert" className="text-sm leading-6 text-danger">
          {serverError.message}
        </p>
      )}
      <Button type="submit" disabled={isPending} className="self-start">
        {isPending ? 'Adding…' : 'Add domain'}
      </Button>
    </form>
  )
}
