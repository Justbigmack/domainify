'use client'

import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { MailIcon } from 'lucide-react'
import { GhostButton } from '@/components/brand/GhostButton'
import { PrimaryButton } from '@/components/brand/PrimaryButton'
import { Text } from '@/components/brand/Text'
import { TextLink } from '@/components/brand/TextLink'
import { FormError } from '@/app/(auth)/_components/FormError'
import { AuthHeadline } from '@/app/(auth)/_components/AuthHeadline'
import { AuthNotice } from '@/app/(auth)/_components/AuthNotice'
import {
  AUTH_CONTROL_CLASSES,
  AUTH_FOOTER_TEXT_CLASSES,
  AUTH_FORM_CLASSES,
} from '@/app/(auth)/_components/authControls'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { authClient } from '@/lib/auth/client/authClient'
import { cn } from '@/lib/utils'

type SendStatus = 'idle' | 'sending' | 'sent'

export const ForgotPasswordCard = () => {
  const [email, setEmail] = useState('')
  const [sendStatus, setSendStatus] = useState<SendStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const requestReset = async () => {
    setSendStatus('sending')
    setErrorMessage(null)
    const { error } = await authClient.requestPasswordReset({
      email,
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) {
      setSendStatus('idle')
      setErrorMessage(error.message ?? 'Could not send the reset link. Please try again.')
      return
    }
    setSendStatus('sent')
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void requestReset()
  }

  const handleEmailChange = (event: ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value)
  }

  const handleUseDifferentEmail = () => {
    setSendStatus('idle')
    setErrorMessage(null)
  }

  if (sendStatus === 'sent') {
    return (
      <AuthNotice
        icon={MailIcon}
        title="Check your inbox"
        description={
          <>
            If an account exists for{' '}
            <Text as="span" className="font-medium text-foreground">
              {email}
            </Text>
            , we sent a link to reset your password. It expires in one hour.
          </>
        }
      >
        <GhostButton
          size="default"
          onClick={handleUseDifferentEmail}
          className={cn(AUTH_CONTROL_CLASSES, 'font-medium text-foreground')}
        >
          Use a different email
        </GhostButton>
      </AuthNotice>
    )
  }

  return (
    <>
      <AuthHeadline
        title="Reset your password"
        description="Enter your account email and we’ll send you a reset link."
      />
      <form onSubmit={handleSubmit} className={AUTH_FORM_CLASSES}>
        <Field>
          <FieldLabel htmlFor="email" className="sr-only">
            Email address
          </FieldLabel>
          <Input
            id="email"
            type="email"
            required
            autoFocus
            autoComplete="email"
            placeholder="Enter your email address"
            value={email}
            onChange={handleEmailChange}
            className={AUTH_CONTROL_CLASSES}
          />
        </Field>
        <FormError message={errorMessage} />
        <PrimaryButton
          type="submit"
          loading={sendStatus === 'sending'}
          className={cn(AUTH_CONTROL_CLASSES, 'mt-1')}
        >
          Send reset link
        </PrimaryButton>
      </form>
      <Text className={AUTH_FOOTER_TEXT_CLASSES}>
        Remembered it?{' '}
        <TextLink href="/login">Back to sign in</TextLink>
      </Text>
    </>
  )
}
