'use client'

import { Text } from '@/components/brand/Text'
import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormError } from '@/app/(auth)/_components/FormError'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { authClient } from '@/lib/auth/client'
import { PASSWORD_MIN_LENGTH } from '@/lib/auth/policy'

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

  const signUp = async () => {
    setIsSubmitting(true)
    setErrorMessage(null)
    const { error } = await authClient.signUp.email({ name, email, password })
    if (error) {
      setIsSubmitting(false)
      setErrorMessage(error.message ?? 'Could not create your account. Please try again.')
      return
    }
    router.push('/domains')
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void signUp()
  }

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value)
  }

  const handleEmailChange = (event: ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value)
  }

  const handlePasswordChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value)
  }

  const loginHref = isAddingAccount ? '/login?add=1' : '/login'

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Create your account</CardTitle>
        <CardDescription>Start tracking and verifying your domains.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="name">Name</FieldLabel>
            <Input
              id="name"
              required
              autoFocus
              autoComplete="name"
              placeholder="Ada Lovelace"
              value={name}
              onChange={handleNameChange}
              className="h-11"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={handleEmailChange}
              className="h-11"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input
              id="password"
              type="password"
              required
              autoComplete="new-password"
              minLength={PASSWORD_MIN_LENGTH}
              value={password}
              onChange={handlePasswordChange}
              className="h-11"
            />
            <FieldDescription>At least {PASSWORD_MIN_LENGTH} characters.</FieldDescription>
          </Field>
          <FormError message={errorMessage} />
          <Button type="submit" loading={isSubmitting}>
            Create account
          </Button>
        </form>
        <Text className="mt-6 text-center text-muted-foreground">
          Already have an account?{' '}
          <Link
            href={loginHref}
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </Text>
      </CardContent>
    </Card>
  )
}
