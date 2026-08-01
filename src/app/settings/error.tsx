'use client'

import { RouteError } from '@/components/brand/RouteError'

type SettingsErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

const SettingsError = ({ reset }: SettingsErrorProps) => <RouteError onRetry={reset} />

export default SettingsError
