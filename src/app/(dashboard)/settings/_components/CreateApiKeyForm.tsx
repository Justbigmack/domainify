'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { KeyRoundIcon } from 'lucide-react'
import { z } from 'zod'
import { AlertBanner, AlertBannerAction } from '@/components/brand/AlertBanner'
import { CopyButton } from '@/components/brand/CopyButton'
import { Section, SectionContent } from '@/components/brand/Section'
import { Text } from '@/components/brand/Text'
import { Button } from '@/components/ui/button'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { authClient } from '@/lib/auth/client'

const KEY_NAME_MAX_LENGTH = 32

const keyNameSchema = z
  .string()
  .trim()
  .min(1, { error: 'Give the key a label.' })
  .max(KEY_NAME_MAX_LENGTH, {
    error: `Keep the label to ${KEY_NAME_MAX_LENGTH} characters or fewer.`,
  })

export const CreateApiKeyForm = () => {
  const router = useRouter()
  const [keyName, setKeyName] = useState('')
  const [hasBlurred, setHasBlurred] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [createdKey, setCreatedKey] = useState<string | null>(null)

  const parsedName = keyNameSchema.safeParse(keyName)
  const hasInput = keyName.trim().length > 0
  const validationMessage = parsedName.success ? null : parsedName.error.issues[0].message
  const clientError = hasBlurred && hasInput && !parsedName.success ? validationMessage : null
  const activeError = clientError ?? serverError

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setKeyName(event.target.value)
    setHasBlurred(false)
    setServerError(null)
  }

  const handleNameBlur = () => {
    setHasBlurred(true)
  }

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isCreating) return
    if (!parsedName.success) {
      setHasBlurred(true)
      return
    }
    setIsCreating(true)
    const { data, error } = await authClient.apiKey.create({ name: parsedName.data })
    setIsCreating(false)
    if (!data) {
      setServerError(error?.message ?? 'Could not create the key. Try again.')
      return
    }
    setCreatedKey(data.key)
  }

  const handleDone = () => {
    router.push('/settings/api-keys')
  }

  if (createdKey) {
    return (
      <AlertBanner
        tone="info"
        icon={KeyRoundIcon}
        action={
          <div className="flex items-center gap-1 self-center">
            <CopyButton value={createdKey} label="Copy the new API key" />
            <AlertBannerAction onClick={handleDone}>Done</AlertBannerAction>
          </div>
        }
      >
        <Text as="span" variant="caption" className="block font-mono break-all text-inherit">
          {createdKey}
        </Text>
        <Text as="span" variant="secondary" className="block pt-1 text-inherit">
          Copy this key now — it is shown only once.
        </Text>
      </AlertBanner>
    )
  }

  return (
    <Section>
      <SectionContent>
        <form onSubmit={handleCreate} className="flex flex-col gap-4 p-5">
          <Field data-invalid={clientError !== null || undefined}>
            <FieldLabel htmlFor="api-key-label">Label</FieldLabel>
            <Input
              id="api-key-label"
              autoFocus
              autoComplete="off"
              value={keyName}
              onChange={handleNameChange}
              onBlur={handleNameBlur}
              aria-invalid={clientError !== null || undefined}
              placeholder="A descriptive label, e.g. Production"
            />
          </Field>
          <div className="flex flex-wrap items-center gap-3">
            {activeError && (
              <Text role="alert" className="min-w-0 leading-6 text-destructive">
                {activeError}
              </Text>
            )}
            <Button
              type="submit"
              loading={isCreating}
              disabled={!hasInput}
              className="ml-auto"
            >
              Create key
            </Button>
          </div>
        </form>
      </SectionContent>
    </Section>
  )
}
