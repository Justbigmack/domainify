'use client'

import { useEffect, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { MailIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { authClient } from '@/lib/auth-client'

type SendStatus = 'idle' | 'sending' | 'sent'

const RESEND_COOLDOWN_SECONDS = 30
const SECOND_MS = 1000

export const SignInCard = () => {
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

  if (sendStatus === 'sent') {
    return (
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-8 text-center shadow-sm">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-surface-muted text-ink-muted">
          <MailIcon className="size-5" />
        </div>
        <h1 className="mt-4 text-lg font-semibold tracking-tight">Check your inbox</h1>
        <p className="mt-2 text-sm leading-6 text-ink-muted">
          We sent a sign-in link to <span className="font-medium text-ink">{email}</span>. It
          expires in a few minutes.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Button
            variant="secondary"
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
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-8 shadow-sm">
      <h1 className="text-lg font-semibold tracking-tight">Sign in to Domainify</h1>
      <p className="mt-1 text-sm leading-6 text-ink-muted">
        We email you a sign-in link — no passwords.
      </p>
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoFocus
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={handleEmailChange}
            className="h-11 rounded-lg border border-border bg-surface px-3 text-base text-ink placeholder:text-ink-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          />
        </div>
        {errorMessage !== null && (
          <p role="alert" className="text-sm text-danger">
            {errorMessage}
          </p>
        )}
        <Button type="submit" disabled={sendStatus === 'sending'}>
          {sendStatus === 'sending' ? 'Sending link…' : 'Send sign-in link'}
        </Button>
      </form>
    </div>
  )
}
