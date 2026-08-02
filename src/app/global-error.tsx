'use client'

import { useTransition } from 'react'
import { RotateCwIcon, TriangleAlertIcon } from 'lucide-react'
import { PageState } from '@/components/brand/PageState'
import { PrimaryButton } from '@/components/brand/PrimaryButton'
import { Text } from '@/components/brand/Text'
import './globals.css'

type GlobalErrorProps = {
  error: Error & { digest?: string }
  unstable_retry: () => void
}

const GlobalError = ({ error, unstable_retry }: GlobalErrorProps) => {
  const [isRetrying, startRetry] = useTransition()

  const handleRetry = () => startRetry(() => unstable_retry())

  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-dvh">
        <PageState
          height="viewport"
          icon={TriangleAlertIcon}
          tone="destructive"
          title="Something went wrong"
          action={
            <PrimaryButton icon={RotateCwIcon} onClick={handleRetry} loading={isRetrying}>
              Try again
            </PrimaryButton>
          }
          footer={
            error.digest && (
              <Text as="span" variant="micro" className="font-mono tabular-nums">
                Error {error.digest}
              </Text>
            )
          }
        >
          Domainify hit an unexpected error and couldn’t finish loading. Trying again usually fixes
          it.
        </PageState>
      </body>
    </html>
  )
}

export default GlobalError
