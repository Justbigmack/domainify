'use client'

import { useTransition } from 'react'
import { RotateCcwIcon } from 'lucide-react'
import { AlertBannerAction } from '@/components/brand/AlertBanner'
import { restartVerificationAction } from '@/lib/domains/actions'

type RestartButtonProps = {
  domainId: string
}

export const RestartButton = ({ domainId }: RestartButtonProps) => {
  const [isRestarting, startTransition] = useTransition()

  const handleRestart = () => {
    startTransition(async () => {
      await restartVerificationAction(domainId)
    })
  }

  return (
    <AlertBannerAction icon={RotateCcwIcon} onClick={handleRestart} loading={isRestarting}>
      Restart verification
    </AlertBannerAction>
  )
}
