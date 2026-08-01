'use client'

import { RouteError } from '@/components/brand/RouteError'

type DashboardErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

const DashboardError = ({ reset }: DashboardErrorProps) => <RouteError onRetry={reset} />

export default DashboardError
