'use client'

import { useState } from 'react'
import { MailIcon } from 'lucide-react'
import { GhostButton } from '@/components/brand/GhostButton'
import { SecondaryButton } from '@/components/brand/SecondaryButton'
import { Text } from '@/components/brand/Text'
import { FormError } from '@/app/(auth)/_components/FormError'
import { AuthNotice } from '@/app/(auth)/_components/AuthNotice'
import { AUTH_CONTROL_CLASSES } from '@/app/(auth)/_components/authControls'
import { authClient } from '@/lib/auth/client'
import {
  RESEND_COOLDOWN_SECONDS,
  useResendCooldown,
} from '@/lib/auth/useResendCooldown'
import { cn } from '@/lib/utils'

type VerifyEmailCardProps = {
  email: string
  hasResent?: boolean
}

export const VerifyEmailCard = ({ email, hasResent = false }: VerifyEmailCardProps) => {
  const initialCooldown = hasResent ? RESEND_COOLDOWN_SECONDS : 0
  const { cooldownSeconds, isCoolingDown, startCooldown } = useResendCooldown(initialCooldown)
  const [isSending, setIsSending] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const resendVerification = async () => {
    setIsSending(true)
    setErrorMessage(null)
    const { error } = await authClient.sendVerificationEmail({ email })
    setIsSending(false)
    if (error) {
      setErrorMessage(error.message ?? 'Could not send the verification link. Please try again.')
      return
    }
    startCooldown()
  }

  const handleResend = () => {
    void resendVerification()
  }

  const description = hasResent
    ? 'We sent a new verification link to'
    : 'We sent a verification link to'

  return (
    <AuthNotice
      icon={MailIcon}
      title="Check your inbox"
      description={
        <>
          {description}{' '}
          <Text as="span" className="font-medium text-foreground">
            {email}
          </Text>
          . Click it to confirm your address and finish setting up your account. It expires in
          one hour.
        </>
      }
    >
      <FormError message={errorMessage} />
      <SecondaryButton
        onClick={handleResend}
        loading={isSending}
        disabled={isCoolingDown}
        className={cn(AUTH_CONTROL_CLASSES, 'tabular-nums')}
      >
        {isCoolingDown ? `Resend in ${cooldownSeconds}s` : 'Resend link'}
      </SecondaryButton>
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
