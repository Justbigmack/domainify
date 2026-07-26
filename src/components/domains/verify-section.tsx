'use client'

import { useEffect, useState, useTransition } from 'react'
import type { PropsWithChildren } from 'react'
import { useRouter } from 'next/navigation'
import { LoaderIcon, RefreshIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { pollDomainAction, verifyDomainAction } from '@/lib/domains/actions'

const POLL_INTERVAL_SECONDS = 30
const SECOND_MS = 1000
const PHASE_ROTATION_MS = 1400

const CHECK_PHASES = [
  'Querying your nameservers…',
  'Asking Cloudflare and Google…',
  'Comparing answers…',
] as const

type VerifySectionProps = PropsWithChildren<{
  domainId: string
  isSettled: boolean
}>

export const VerifySection = ({ domainId, isSettled, children }: VerifySectionProps) => {
  const router = useRouter()
  const [isChecking, startTransition] = useTransition()
  const [countdownSeconds, setCountdownSeconds] = useState(POLL_INTERVAL_SECONDS)
  const [phaseIndex, setPhaseIndex] = useState(0)
  const [cooldownMessage, setCooldownMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!isChecking) return
    const timer = setInterval(
      () => setPhaseIndex((current) => (current + 1) % CHECK_PHASES.length),
      PHASE_ROTATION_MS,
    )
    return () => clearInterval(timer)
  }, [isChecking])

  useEffect(() => {
    if (isSettled || isChecking) return
    const timer = setInterval(
      () => setCountdownSeconds((current) => (current > 0 ? current - 1 : current)),
      SECOND_MS,
    )
    return () => clearInterval(timer)
  }, [isSettled, isChecking])

  useEffect(() => {
    if (countdownSeconds !== 0 || isSettled || isChecking) return
    startTransition(async () => {
      setPhaseIndex(0)
      await pollDomainAction(domainId)
      router.refresh()
      setCountdownSeconds(POLL_INTERVAL_SECONDS)
    })
  }, [countdownSeconds, isSettled, isChecking, domainId, router, startTransition])

  const handleVerify = () => {
    setCooldownMessage(null)
    setPhaseIndex(0)
    startTransition(async () => {
      const result = await verifyDomainAction(domainId)
      if (!result.ok && result.error.code === 'cooldown') {
        setCooldownMessage(result.error.message)
      }
      router.refresh()
      setCountdownSeconds(POLL_INTERVAL_SECONDS)
    })
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="secondary" onClick={handleVerify} disabled={isChecking}>
          <RefreshIcon className="size-4" />
          Verify now
        </Button>
        <span
          aria-live="polite"
          className="flex items-center gap-2 text-sm text-ink-muted tabular-nums"
        >
          {isChecking ? (
            <>
              <LoaderIcon className="size-4 motion-safe:animate-spin" />
              {CHECK_PHASES[phaseIndex]}
            </>
          ) : (
            !isSettled && `Auto-check in ${countdownSeconds}s`
          )}
        </span>
      </div>
      {cooldownMessage && (
        <p role="alert" className="text-sm text-warning">
          {cooldownMessage}
        </p>
      )}
      {children}
    </section>
  )
}
