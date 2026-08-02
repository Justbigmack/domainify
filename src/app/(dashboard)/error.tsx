'use client'

import { RouteError } from '@/components/brand/RouteError'

type DashboardErrorProps = {
  error: Error & { digest?: string }
  unstable_retry: () => void
}

const DashboardError = ({ error, unstable_retry }: DashboardErrorProps) => (
  <RouteError onRetry={unstable_retry} digest={error.digest} />
)

export default DashboardError
