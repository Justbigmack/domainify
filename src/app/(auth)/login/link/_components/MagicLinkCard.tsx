'use client'

import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { MailIcon } from 'lucide-react'
import { GhostButton } from '@/components/brand/GhostButton'
import { PrimaryButton } from '@/components/brand/PrimaryButton'
import { SecondaryButton } from '@/components/brand/SecondaryButton'
import { Text } from '@/components/brand/Text'
import { FormError } from '@/app/(auth)/_components/FormError'
import { AuthHeadline } from '@/app/(auth)/_components/AuthHeadline'
import { AuthNotice } from '@/app/(auth)/_components/AuthNotice'
import {
  AUTH_CONTROL_CLASSES,
  AUTH_FORM_CLASSES,
  AUTH_SEPARATOR_CLASSES,
} from '@/app/(auth)/_components/authControls'
import { Field, FieldLabel, FieldSeparator } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { authClient } from '@/lib/auth/client/authClient'
import { magicLinkFormSchema } from '@/lib/auth/model/formSchemas'
import { useFormValidation } from '@/lib/auth/client/useFormValidation'
import { useResendCooldown } from '@/lib/auth/client/useResendCooldown'
import { cn } from '@/lib/utils'

type SendStatus = 'idle' | 'sending' | 'sent'

type MagicLinkCardProps = {
  isAddingAccount?: boolean
}

export const MagicLinkCard = ({ isAddingAccount = false }: MagicLinkCardProps) => {
  const [email, setEmail] = useState('')
  const [sendStatus, setSendStatus] = useState<SendStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const { cooldownSeconds, isCoolingDown, startCooldown, clearCooldown } = useResendCooldown()
  const { parsed, errorFor, revealErrors } = useFormValidation(magicLinkFormSchema, { email })

  const emailError = errorFor('email')

  const sendMagicLink = async (emailAddress: string) => {
    setSendStatus('sending')
    setErrorMessage(null)
    const { error } = await authClient.signIn.magicLink({
      email: emailAddress,
      callbackURL: '/domains',
    })
    if (error) {
      setSendStatus('idle')
      setErrorMessage(error.message ?? 'Could not send the sign-in link. Please try again.')
      return
    }
    setSendStatus('sent')
    startCooldown()
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!parsed.success) {
      revealErrors()
      return
    }
    setEmail(parsed.data.email)
    void sendMagicLink(parsed.data.email)
  }

  const handleResend = () => {
    void sendMagicLink(email)
  }

  const handleEmailChange = (event: ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value)
    setErrorMessage(null)
  }

  const handleUseDifferentEmail = () => {
    setSendStatus('idle')
    clearCooldown()
    setErrorMessage(null)
  }

  const title = isAddingAccount ? 'Add an account' : 'Sign in with an email link'
  const passwordLoginHref = isAddingAccount ? '/login?add=1' : '/login'

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
            , a sign-in link is on its way. It expires in a few minutes.
          </>
        }
      >
        <SecondaryButton
          onClick={handleResend}
          disabled={isCoolingDown}
          className={cn(AUTH_CONTROL_CLASSES, 'tabular-nums')}
        >
          {isCoolingDown ? `Resend in ${cooldownSeconds}s` : 'Resend link'}
        </SecondaryButton>
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
        title={title}
        description="We’ll email you a one-time link. No password needed."
      />
      <form onSubmit={handleSubmit} noValidate className={AUTH_FORM_CLASSES}>
        <Field data-invalid={emailError !== null || undefined}>
          <FieldLabel htmlFor="email" className="sr-only">
            Email address
          </FieldLabel>
          <Input
            id="email"
            type="email"
            autoFocus
            autoComplete="email"
            placeholder="Enter your email address"
            value={email}
            onChange={handleEmailChange}
            aria-invalid={emailError !== null || undefined}
            aria-describedby={emailError === null ? undefined : 'email-error'}
            className={AUTH_CONTROL_CLASSES}
          />
          <FormError id="email-error" message={emailError} />
        </Field>
        <FormError message={errorMessage} />
        <PrimaryButton
          type="submit"
          loading={sendStatus === 'sending'}
          className={cn(AUTH_CONTROL_CLASSES, 'mt-1')}
        >
          Send sign-in link
        </PrimaryButton>
      </form>
      <FieldSeparator className={AUTH_SEPARATOR_CLASSES}>or</FieldSeparator>
      <SecondaryButton href={passwordLoginHref} className={AUTH_CONTROL_CLASSES}>
        Sign in with a password
      </SecondaryButton>
    </>
  )
}
