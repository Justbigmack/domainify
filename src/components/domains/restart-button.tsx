'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { RotateCcwIcon } from 'lucide-react'
import { Settings } from '@/components/brand/settings'
import { restartVerificationAction } from '@/lib/domains/actions'

type RestartButtonProps = {
  domainId: string
}

export const RestartButton = ({ domainId }: RestartButtonProps) => {
  const router = useRouter()
  const [isRestarting, startTransition] = useTransition()

  const handleRestart = () => {
    startTransition(async () => {
      await restartVerificationAction(domainId)
      router.refresh()
    })
  }

  return (
    <Settings.AlertAction icon={RotateCcwIcon} onClick={handleRestart} loading={isRestarting}>
      Restart verification
    </Settings.AlertAction>
  )
}
