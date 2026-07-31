'use client'

import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import Link from 'next/link'
import { CircleCheckIcon, CircleAlertIcon } from 'lucide-react'
import { FormError } from '@/components/auth/FormError'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { authClient } from '@/lib/authClient'
import { PASSWORD_MIN_LENGTH } from '@/lib/authPolicy'
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
      <Card className="w-full max-w-sm text-center">
        <CardContent className="flex flex-col items-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <CircleAlertIcon className="size-5" />
          </div>
          <h1 className="mt-4 font-heading text-lg font-semibold tracking-tight">
            This link is invalid or expired
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Password reset links can only be used once and expire after one hour. Request a
            new one to continue.
          </p>
          <div className="mt-6 flex w-full flex-col gap-2">
            <Link href="/forgot-password" className={cn(buttonVariants({ variant: 'default' }))}>
              Request a new link
            </Link>
            <Link href="/login" className={cn(buttonVariants({ variant: 'ghost' }))}>
              Back to sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (hasReset) {
    return (
      <Card className="w-full max-w-sm text-center">
        <CardContent className="flex flex-col items-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <CircleCheckIcon className="size-5" />
          </div>
          <h1 className="mt-4 font-heading text-lg font-semibold tracking-tight">
            Password updated
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Your password has been changed and existing sessions were signed out. Sign in with
            your new password to continue.
          </p>
          <div className="mt-6 flex w-full flex-col gap-2">
            <Link href="/login" className={cn(buttonVariants({ variant: 'default' }))}>
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Choose a new password</CardTitle>
        <CardDescription>You&apos;ll use it the next time you sign in.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="new-password">New password</FieldLabel>
            <Input
              id="new-password"
              type="password"
              required
              autoFocus
              autoComplete="new-password"
              minLength={PASSWORD_MIN_LENGTH}
              value={newPassword}
              onChange={handlePasswordChange}
              className="h-11"
            />
            <FieldDescription>At least {PASSWORD_MIN_LENGTH} characters.</FieldDescription>
          </Field>
          <FormError message={errorMessage} />
          <Button type="submit" loading={isSubmitting}>
            Update password
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
