'use client'

import { useEffect, useState } from 'react'
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

const RESEND_COOLDOWN_SECONDS = 30
const SECOND_MS = 1000

type MagicLinkCardProps = {
  isAddingAccount?: boolean
}

export const MagicLinkCard = ({ isAddingAccount = false }: MagicLinkCardProps) => {
  const [email, setEmail] = useState('')
  const [sendStatus, setSendStatus] = useState<SendStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [cooldownSeconds, setCooldownSeconds] = useState(0)

  const isCoolingDown = cooldownSeconds > 0

  useEffect(() => {
    if (!isCoolingDown) return
    const timer = setInterval(
      () => setCooldownSeconds((current) => Math.max(0, current - 1)),
      SECOND_MS,
    )
    return () => clearInterval(timer)
  }, [isCoolingDown])

  const sendMagicLink = async () => {
    setSendStatus('sending')
    setErrorMessage(null)
    const { error } = await authClient.signIn.magicLink({ email, callbackURL: '/domains' })
    if (error) {
      setSendStatus('idle')
      setErrorMessage(error.message ?? 'Could not send the sign-in link. Please try again.')
      return
    }
    setSendStatus('sent')
    setCooldownSeconds(RESEND_COOLDOWN_SECONDS)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void sendMagicLink()
  }

  const handleResend = () => {
    void sendMagicLink()
  }

  const handleEmailChange = (event: ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value)
  }

  const handleUseDifferentEmail = () => {
    setSendStatus('idle')
    setCooldownSeconds(0)
    setErrorMessage(null)
  }

  const cardTitle = isAddingAccount ? 'Add an account' : 'Sign in with an email link'
  const passwordLoginHref = isAddingAccount ? '/login?add=1' : '/login'

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
            We sent a sign-in link to <Text as="span" className="font-medium">{email}</Text>.
            It expires in a few minutes.
          </Text>
          <div className="mt-6 flex w-full flex-col gap-2">
            <Button
              variant="outline"
              onClick={handleResend}
              disabled={isCoolingDown}
              className="tabular-nums"
            >
              {isCoolingDown ? `Resend in ${cooldownSeconds}s` : 'Resend link'}
            </Button>
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
        <CardTitle>{cardTitle}</CardTitle>
        <CardDescription>We&apos;ll email you a one-time link. No password needed.</CardDescription>
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
            Send sign-in link
          </Button>
        </form>
        <Text className="mt-6 text-center text-muted-foreground">
          Prefer a password?{' '}
          <Link
            href={passwordLoginHref}
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Sign in with password
          </Link>
        </Text>
      </CardContent>
    </Card>
  )
}
