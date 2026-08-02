'use client'

import { useTransition } from 'react'
import { RotateCwIcon, TriangleAlertIcon } from 'lucide-react'
import { PageState } from '@/components/brand/PageState'
import { Text } from '@/components/brand/Text'
import { Button } from '@/components/ui/button'

type RouteErrorProps = {
  onRetry: () => void
  digest?: string
}

export const RouteError = ({ onRetry, digest }: RouteErrorProps) => {
  const [isRetrying, startRetry] = useTransition()

  const handleRetry = () => startRetry(() => onRetry())

  return (
    <PageState
      icon={TriangleAlertIcon}
      tone="destructive"
      title="This page didn’t load"
      action={
        <Button onClick={handleRetry} loading={isRetrying}>
          <RotateCwIcon data-icon="inline-start" />
          Try again
        </Button>
      }
      footer={
        digest && (
          <Text as="span" variant="micro" className="font-mono tabular-nums">
            Error {digest}
          </Text>
        )
      }
    >
      The request failed before the page could finish rendering. Trying again usually fixes it.
    </PageState>
  )
}
