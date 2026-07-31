'use client'

import { useActionState, useState } from 'react'
import type { ChangeEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
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
  const activeError = clientError ?? state?.error ?? null

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
    <form action={formAction} className="flex flex-col gap-4">
      <Field data-invalid={clientError !== null || undefined}>
        <FieldLabel htmlFor="domain-name" className="px-5">
          Domain name
        </FieldLabel>
        <Input
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
          aria-invalid={clientError !== null || undefined}
          className="h-11 bg-card px-5"
        />
        <FieldDescription className="px-5">
          Paste anything, even a full URL. We&apos;ll extract the domain.
        </FieldDescription>
      </Field>
      {parsedDomain && (
        <div className="flex flex-col gap-2 rounded-xl border border-border/50 bg-card px-5 py-3 text-sm">
          <p>
            You&apos;re claiming <strong className="font-semibold">{parsedDomain.hostname}</strong>
            {!parsedDomain.isApex && (
              <span className="text-muted-foreground">
                , a subdomain of {parsedDomain.registrableDomain}
              </span>
            )}
          </p>
          <p className="text-muted-foreground">
            We&apos;ll ask you to create a TXT record at{' '}
            <span className="break-all">{parsedDomain.challengeHost}</span>
          </p>
          {apexAlternative && (
            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={handleUseApex}
              className="self-start px-0"
            >
              Claim {apexAlternative} instead
            </Button>
          )}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3">
        {activeError && (
          <p role="alert" className="min-w-0 px-5 text-sm leading-6 text-destructive">
            {activeError.message}
          </p>
        )}
        <Button type="submit" loading={isPending} className="ml-auto">
          Add domain
        </Button>
      </div>
    </form>
  )
}
