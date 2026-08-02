'use client'

import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { CircleAlertIcon, CircleCheckIcon } from 'lucide-react'
import { GhostButton } from '@/components/brand/GhostButton'
import { PrimaryButton } from '@/components/brand/PrimaryButton'
import { FormError } from '@/app/(auth)/_components/FormError'
import { AuthHeadline } from '@/app/(auth)/_components/AuthHeadline'
import { AuthNotice } from '@/app/(auth)/_components/AuthNotice'
import {
  AUTH_CONTROL_CLASSES,
  AUTH_FORM_CLASSES,
} from '@/app/(auth)/_components/authControls'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { authClient } from '@/lib/auth/client/authClient'
import { resetPasswordFormSchema } from '@/lib/auth/model/formSchemas'
import { useFormValidation } from '@/lib/auth/client/useFormValidation'
import { PASSWORD_MIN_LENGTH } from '@/lib/auth/model/policy'
import { cn } from '@/lib/utils'

type ResetPasswordCardProps = {
  token: string | null
}

export const ResetPasswordCard = ({ token }: ResetPasswordCardProps) => {
  const [newPassword, setNewPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasReset, setHasReset] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const { parsed, errorFor, revealErrors } = useFormValidation(resetPasswordFormSchema, {
    newPassword,
  })

  const newPasswordError = errorFor('newPassword')

  const resetPassword = async (password: string) => {
    if (token === null) return
    setIsSubmitting(true)
    setErrorMessage(null)
    const { error } = await authClient.resetPassword({ newPassword: password, token })
    if (error) {
      setIsSubmitting(false)
      setErrorMessage(error.message ?? 'Could not reset your password. Please try again.')
      return
    }
    setHasReset(true)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!parsed.success) {
      revealErrors()
      return
    }
    void resetPassword(parsed.data.newPassword)
  }

  const handlePasswordChange = (event: ChangeEvent<HTMLInputElement>) => {
    setNewPassword(event.target.value)
    setErrorMessage(null)
  }

  if (token === null) {
    return (
      <AuthNotice
        icon={CircleAlertIcon}
        title="This link is invalid or expired"
        description="Password reset links can only be used once and expire after one hour. Request a new one to continue."
      >
        <PrimaryButton href="/forgot-password" className={AUTH_CONTROL_CLASSES}>
          Request a new link
        </PrimaryButton>
        <GhostButton
          href="/login"
          size="default"
          className={cn(AUTH_CONTROL_CLASSES, 'font-medium text-foreground')}
        >
          Back to sign in
        </GhostButton>
      </AuthNotice>
    )
  }

  if (hasReset) {
    return (
      <AuthNotice
        icon={CircleCheckIcon}
        title="Password updated"
        description="Your password has been changed and existing sessions were signed out. Sign in with your new password to continue."
      >
        <PrimaryButton href="/login" className={AUTH_CONTROL_CLASSES}>
          Sign in
        </PrimaryButton>
      </AuthNotice>
    )
  }

  return (
    <>
      <AuthHeadline
        title="Choose a new password"
        description="You’ll use it the next time you sign in."
      />
      <form onSubmit={handleSubmit} noValidate className={AUTH_FORM_CLASSES}>
        <Field data-invalid={newPasswordError !== null || undefined}>
          <FieldLabel htmlFor="new-password" className="sr-only">
            New password
          </FieldLabel>
          <Input
            id="new-password"
            type="password"
            autoFocus
            autoComplete="new-password"
            placeholder={`New password — at least ${PASSWORD_MIN_LENGTH} characters`}
            value={newPassword}
            onChange={handlePasswordChange}
            aria-invalid={newPasswordError !== null || undefined}
            aria-describedby={newPasswordError === null ? undefined : 'new-password-error'}
            className={AUTH_CONTROL_CLASSES}
          />
          <FormError id="new-password-error" message={newPasswordError} />
        </Field>
        <FormError message={errorMessage} />
        <PrimaryButton
          type="submit"
          loading={isSubmitting}
          className={cn(AUTH_CONTROL_CLASSES, 'mt-1')}
        >
          Update password
        </PrimaryButton>
      </form>
    </>
  )
}
