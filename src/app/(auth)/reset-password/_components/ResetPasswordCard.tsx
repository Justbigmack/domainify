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

  const resetPassword = async () => {
    if (token === null) return
    setIsSubmitting(true)
    setErrorMessage(null)
    const { error } = await authClient.resetPassword({ newPassword, token })
    if (error) {
      setIsSubmitting(false)
      setErrorMessage(error.message ?? 'Could not reset your password. Please try again.')
      return
    }
    setHasReset(true)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void resetPassword()
  }

  const handlePasswordChange = (event: ChangeEvent<HTMLInputElement>) => {
    setNewPassword(event.target.value)
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
      <form onSubmit={handleSubmit} className={AUTH_FORM_CLASSES}>
        <Field>
          <FieldLabel htmlFor="new-password" className="sr-only">
            New password
          </FieldLabel>
          <Input
            id="new-password"
            type="password"
            required
            autoFocus
            autoComplete="new-password"
            minLength={PASSWORD_MIN_LENGTH}
            placeholder={`New password — at least ${PASSWORD_MIN_LENGTH} characters`}
            value={newPassword}
            onChange={handlePasswordChange}
            className={AUTH_CONTROL_CLASSES}
          />
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
