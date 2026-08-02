'use client'

import { RouteError } from '@/components/brand/RouteError'

type SettingsErrorProps = {
  error: Error & { digest?: string }
  unstable_retry: () => void
}

const SettingsError = ({ error, unstable_retry }: SettingsErrorProps) => (
  <RouteError onRetry={unstable_retry} digest={error.digest} />
)

export default SettingsError
