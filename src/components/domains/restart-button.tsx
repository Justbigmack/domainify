'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
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
    <Button onClick={handleRestart} disabled={isRestarting}>
      {isRestarting ? 'Restarting…' : 'Restart verification'}
    </Button>
  )
}
