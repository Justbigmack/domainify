'use client'

import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormError } from '@/components/auth/FormError'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Field, FieldLabel, FieldSeparator } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { authClient } from '@/lib/authClient'
import { cn } from '@/lib/utils'

type LoginCardProps = {
  isAddingAccount?: boolean
}

export const LoginCard = ({ isAddingAccount = false }: LoginCardProps) => {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const signIn = async () => {
    setIsSubmitting(true)
    setErrorMessage(null)
    const { error } = await authClient.signIn.email({ email, password })
    if (error) {
      setIsSubmitting(false)
      setErrorMessage(error.message ?? 'Could not sign you in. Please try again.')
      return
    }
    router.push('/domains')
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void signIn()
  }

  const handleEmailChange = (event: ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value)
  }

  const handlePasswordChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value)
  }

  const cardTitle = isAddingAccount ? 'Add an account' : 'Sign in to Domainify'
  const magicLinkHref = isAddingAccount ? '/login/link?add=1' : '/login/link'
  const signUpHref = isAddingAccount ? '/sign-up?add=1' : '/sign-up'

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{cardTitle}</CardTitle>
        <CardDescription>Enter your email and password to continue.</CardDescription>
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
          <Field>
            <div className="flex items-center justify-between">
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Link
                href="/forgot-password"
                className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={handlePasswordChange}
              className="h-11"
            />
          </Field>
          <FormError message={errorMessage} />
          <Button type="submit" loading={isSubmitting}>
            Sign in
          </Button>
          <FieldSeparator>or</FieldSeparator>
          <Link href={magicLinkHref} className={cn(buttonVariants({ variant: 'outline' }))}>
            Email me a sign-in link
          </Link>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          New to Domainify?{' '}
          <Link
            href={signUpHref}
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Create an account
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
