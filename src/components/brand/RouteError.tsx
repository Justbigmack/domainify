'use client'

import { TriangleAlertIcon } from 'lucide-react'
import { AlertBanner, AlertBannerAction } from '@/components/brand/AlertBanner'

type RouteErrorProps = {
  onRetry: () => void
}

export const RouteError = ({ onRetry }: RouteErrorProps) => (
  <div className="mx-auto flex w-full max-w-6xl flex-col px-6 py-8 lg:px-10">
    <AlertBanner
      tone="destructive"
      icon={TriangleAlertIcon}
      action={<AlertBannerAction onClick={onRetry}>Try again</AlertBannerAction>}
    >
      Something went wrong loading this page. Trying again usually fixes it.
    </AlertBanner>
  </div>
)
