'use client'

import { useState } from 'react'
import { Heading } from '@/components/brand/Heading'
import { Text } from '@/components/brand/Text'
import type { ChangeEvent, FormEvent } from 'react'
import Link from 'next/link'
import { MailIcon } from 'lucide-react'
import { FormError } from '@/app/(auth)/_components/FormError'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { authClient } from '@/lib/auth/client'

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
      <Card className="w-full max-w-sm text-center">
        <CardContent className="flex flex-col items-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <MailIcon className="size-5" />
          </div>
          <Heading as="h1" size="h2" className="mt-4">
            Check your inbox
          </Heading>
          <Text className="mt-2 leading-6 text-muted-foreground">
            If an account exists for{' '}
            <Text as="span" className="font-medium">{email}</Text>, we sent a link to
            reset your password. It expires in one hour.
          </Text>
          <div className="mt-6 flex w-full flex-col gap-2">
            <Button variant="ghost" onClick={handleUseDifferentEmail}>
              Use a different email
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Reset your password</CardTitle>
        <CardDescription>
          Enter your account email and we&apos;ll send you a reset link.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              required
              autoFocus
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={handleEmailChange}
              className="h-11"
            />
          </Field>
          <FormError message={errorMessage} />
          <Button type="submit" loading={sendStatus === 'sending'}>
            Send reset link
          </Button>
        </form>
        <Text className="mt-6 text-center text-muted-foreground">
          Remembered it?{' '}
          <Link
            href="/login"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Back to sign in
          </Link>
        </Text>
      </CardContent>
    </Card>
  )
}
