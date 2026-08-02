'use client'

import { TriangleAlertIcon } from 'lucide-react'
import { AlertBanner, AlertBannerAction } from '@/components/brand/AlertBanner'
import { PageContainer } from '@/components/brand/PageContainer'

type RouteErrorProps = {
  onRetry: () => void
  hasContainer?: boolean
}

export const RouteError = ({ onRetry, hasContainer = true }: RouteErrorProps) => {
  const banner = (
    <AlertBanner
      tone="destructive"
      icon={TriangleAlertIcon}
      action={<AlertBannerAction onClick={onRetry}>Try again</AlertBannerAction>}
    >
      Something went wrong loading this page. Trying again usually fixes it.
    </AlertBanner>
  )

  if (!hasContainer) return banner

  return <PageContainer gap="none">{banner}</PageContainer>
}
