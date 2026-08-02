'use client'

import { useActionState, useState } from 'react'
import type { ChangeEvent } from 'react'
import { PrimaryButton } from '@/components/brand/PrimaryButton'
import { Text } from '@/components/brand/Text'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { normalizeDomainInput } from '@/lib/dns/normalize'
import { createDomainAction } from '@/lib/domains/actions'

const WWW_PREFIX = 'www.'

export const AddDomainForm = () => {
  const [inputValue, setInputValue] = useState('')
  const [submittedValue, setSubmittedValue] = useState('')
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
  const isServerErrorStale = isPending || submittedValue !== inputValue
  const serverError = isServerErrorStale ? null : (state?.error ?? null)
  const activeError = clientError ?? serverError

  const handleSubmit = (formData: FormData) => {
    setSubmittedValue(inputValue)
    formAction(formData)
  }

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
    <form action={handleSubmit} className="flex flex-col gap-4">
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
          <Text>
            You&apos;re claiming <strong className="font-semibold">{parsedDomain.hostname}</strong>
            {!parsedDomain.isApex && (
              <Text as="span" className="text-muted-foreground">
                , a subdomain of {parsedDomain.registrableDomain}
              </Text>
            )}
          </Text>
          <Text className="text-muted-foreground">
            We&apos;ll ask you to create a TXT record at{' '}
            <span className="break-all">{parsedDomain.challengeHost}</span>
          </Text>
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
          <Text role="alert" className="min-w-0 px-5 leading-6 text-destructive">
            {activeError.message}
          </Text>
        )}
        <PrimaryButton type="submit" loading={isPending} className="ml-auto">
          Add domain
        </PrimaryButton>
      </div>
    </form>
  )
}
