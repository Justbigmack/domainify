'use client'

import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { PrimaryButton } from '@/components/brand/PrimaryButton'
import { Text } from '@/components/brand/Text'
import { TextLink } from '@/components/brand/TextLink'
import { FormError } from '@/app/(auth)/_components/FormError'
import { AuthHeadline } from '@/app/(auth)/_components/AuthHeadline'
import {
  AUTH_CONTROL_CLASSES,
  AUTH_FOOTER_TEXT_CLASSES,
  AUTH_FORM_CLASSES,
} from '@/app/(auth)/_components/authControls'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { authClient } from '@/lib/auth/client'
import { signUpFormSchema, type SignUpFormValues } from '@/lib/auth/formSchemas'
import { PASSWORD_MIN_LENGTH } from '@/lib/auth/policy'
import { useFormValidation } from '@/lib/auth/useFormValidation'
import { useResetOnHide } from '@/lib/auth/useResetOnHide'
import { cn } from '@/lib/utils'

type SignUpCardProps = {
  isAddingAccount?: boolean
}

export const SignUpCard = ({ isAddingAccount = false }: SignUpCardProps) => {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const { parsed, errorFor, revealErrors, resetErrors } = useFormValidation(
    signUpFormSchema,
    { name, email, password },
  )

  const nameError = errorFor('name')
  const emailError = errorFor('email')
  const passwordError = errorFor('password')

  const resetForm = () => {
    setName('')
    setEmail('')
    setPassword('')
    setIsSubmitting(false)
    setErrorMessage(null)
    resetErrors()
  }

  const markForReset = useResetOnHide(resetForm)

  const signUp = async (values: SignUpFormValues) => {
    setIsSubmitting(true)
    setErrorMessage(null)
    const { error } = await authClient.signUp.email(values)
    if (error) {
      setIsSubmitting(false)
      setErrorMessage(error.message ?? 'Could not create your account. Please try again.')
      return
    }
    markForReset()
    router.push(`/verify-email?email=${encodeURIComponent(values.email)}`)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!parsed.success) {
      revealErrors()
      return
    }
    void signUp(parsed.data)
  }

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value)
    setErrorMessage(null)
  }

  const handleEmailChange = (event: ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value)
    setErrorMessage(null)
  }

  const handlePasswordChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value)
    setErrorMessage(null)
  }

  const loginHref = isAddingAccount ? '/login?add=1' : '/login'

  return (
    <>
      <AuthHeadline
        title="Create your account"
        description="Start tracking and verifying your domains."
      />
      <form onSubmit={handleSubmit} noValidate className={AUTH_FORM_CLASSES}>
        <Field data-invalid={nameError !== null || undefined}>
          <FieldLabel htmlFor="name" className="sr-only">
            Name
          </FieldLabel>
          <Input
            id="name"
            autoFocus
            autoComplete="name"
            placeholder="Your name"
            value={name}
            onChange={handleNameChange}
            aria-invalid={nameError !== null || undefined}
            aria-describedby={nameError === null ? undefined : 'name-error'}
            className={AUTH_CONTROL_CLASSES}
          />
          <FormError id="name-error" message={nameError} />
        </Field>
        <Field data-invalid={emailError !== null || undefined}>
          <FieldLabel htmlFor="email" className="sr-only">
            Email address
          </FieldLabel>
          <Input
            id="email"
            type="email"
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
            autoComplete="new-password"
            placeholder={`Password — at least ${PASSWORD_MIN_LENGTH} characters`}
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
          Create account
        </PrimaryButton>
      </form>
      <Text className={AUTH_FOOTER_TEXT_CLASSES}>
        Already have an account?{' '}
        <TextLink href={loginHref}>Sign in</TextLink>
      </Text>
    </>
  )
}
