'use client'

import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { PrimaryButton } from '@/components/brand/PrimaryButton'
import { SecondaryButton } from '@/components/brand/SecondaryButton'
import { Text } from '@/components/brand/Text'
import { TextLink } from '@/components/brand/TextLink'
import { FormError } from '@/app/(auth)/_components/FormError'
import { AuthHeadline } from '@/app/(auth)/_components/AuthHeadline'
import {
  AUTH_CONTROL_CLASSES,
  AUTH_FOOTER_TEXT_CLASSES,
  AUTH_FORM_CLASSES,
  AUTH_SEPARATOR_CLASSES,
} from '@/app/(auth)/_components/authControls'
import type { VerificationNotice } from '@/app/(auth)/login/_components/verificationNotice'
import { Field, FieldLabel, FieldSeparator } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { authClient } from '@/lib/auth/client'
import { loginFormSchema, type LoginFormValues } from '@/lib/auth/formSchemas'
import { useFormValidation } from '@/lib/auth/useFormValidation'
import { useResetOnHide } from '@/lib/auth/useResetOnHide'
import { cn } from '@/lib/utils'

const UNVERIFIED_EMAIL_CODE = 'EMAIL_NOT_VERIFIED'

type LoginCardProps = {
  isAddingAccount?: boolean
  verificationNotice?: VerificationNotice | null
}

export const LoginCard = ({
  isAddingAccount = false,
  verificationNotice = null,
}: LoginCardProps) => {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const { parsed, errorFor, revealErrors, resetErrors } = useFormValidation(
    loginFormSchema,
    { email, password },
  )

  const emailError = errorFor('email')
  const passwordError = errorFor('password')

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setIsSubmitting(false)
    setErrorMessage(null)
    resetErrors()
  }

  const markForReset = useResetOnHide(resetForm)

  const signIn = async (values: LoginFormValues) => {
    setIsSubmitting(true)
    setErrorMessage(null)
    const { error } = await authClient.signIn.email(values)
    if (error?.code === UNVERIFIED_EMAIL_CODE) {
      markForReset()
      router.push(`/verify-email?email=${encodeURIComponent(values.email)}&resent=1`)
      return
    }
    if (error) {
      setIsSubmitting(false)
      setErrorMessage(error.message ?? 'Could not sign you in. Please try again.')
      return
    }
    markForReset()
    router.push('/domains')
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!parsed.success) {
      revealErrors()
      return
    }
    void signIn(parsed.data)
  }

  const handleEmailChange = (event: ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value)
    setErrorMessage(null)
  }

  const handlePasswordChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value)
    setErrorMessage(null)
  }

  const title = isAddingAccount ? 'Add an account' : 'Sign in to domainify'
  const description = isAddingAccount
    ? 'Sign in with another account to switch between them.'
    : 'Welcome. Let’s get you in.'
  const magicLinkHref = isAddingAccount ? '/login/link?add=1' : '/login/link'
  const signUpHref = isAddingAccount ? '/signup?add=1' : '/signup'
  const hasSuccessNotice = verificationNotice?.tone === 'success'
  const noticeRole = hasSuccessNotice ? 'status' : 'alert'

  return (
    <>
      <AuthHeadline title={title} description={description} />
      {verificationNotice === null ? null : (
        <Text
          role={noticeRole}
          className={cn('mt-4 text-center leading-6', {
            'text-success': hasSuccessNotice,
            'text-destructive': !hasSuccessNotice,
          })}
        >
          {verificationNotice.message}
        </Text>
      )}
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
        <Field data-invalid={passwordError !== null || undefined}>
          <FieldLabel htmlFor="password" className="sr-only">
            Password
          </FieldLabel>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="Password"
            value={password}
            onChange={handlePasswordChange}
            aria-invalid={passwordError !== null || undefined}
            aria-describedby={passwordError === null ? undefined : 'password-error'}
            className={AUTH_CONTROL_CLASSES}
          />
          <FormError id="password-error" message={passwordError} />
        </Field>
        <FormError message={errorMessage} />
        <PrimaryButton
          type="submit"
          loading={isSubmitting}
          className={cn(AUTH_CONTROL_CLASSES, 'mt-1')}
        >
          Sign in
        </PrimaryButton>
      </form>
      <div className="mt-4 flex justify-center">
        <TextLink href="/forgot-password" className="font-normal">
          <Text as="span" className="text-[0.8125rem] text-current">
            Forgot your password?
          </Text>
        </TextLink>
      </div>
      <FieldSeparator className={AUTH_SEPARATOR_CLASSES}>or</FieldSeparator>
      <SecondaryButton href={magicLinkHref} className={AUTH_CONTROL_CLASSES}>
        Email me a sign-in link
      </SecondaryButton>
      <Text className={AUTH_FOOTER_TEXT_CLASSES}>
        Don’t have an account yet? <TextLink href={signUpHref}>Sign up</TextLink>
      </Text>
    </>
  )
}
