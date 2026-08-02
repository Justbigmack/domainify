'use client'

import { useEffect, useId, useState, useTransition } from 'react'
import type { ReactNode } from 'react'
import { ClockIcon, ExternalLinkIcon, RefreshCwIcon } from 'lucide-react'
import { GhostButton } from '@/components/brand/GhostButton'
import { AlertBanner } from '@/components/brand/AlertBanner'
import { SectionContent, SectionToolbar } from '@/components/brand/Section'
import {
  OTHER_PROVIDER_ID,
  ProviderSelect,
  findDnsProvider,
} from '@/lib/domains/_components/ProviderSelect'
import { MiddleTruncate } from '@/lib/domains/_components/MiddleTruncate'
import { PollCountdown } from '@/lib/domains/_components/PollCountdown'
import { TerminalCheck } from '@/lib/domains/_components/TerminalCheck'
import { CopyButton } from '@/components/brand/CopyButton'
import { Text } from '@/components/brand/Text'
import { Spinner } from '@/components/ui/spinner'
import { pollDomainAction, verifyDomainAction } from '@/lib/domains/actions'
import { pollDelaySeconds } from '@/lib/domains/model/schedule'
import { cn } from '@/lib/utils'

const SECOND_MS = 1000
const PHASE_ROTATION_MS = 1400

const CHECK_PHASES = [
  'Querying your nameservers…',
  'Asking Cloudflare and Google…',
  'Comparing answers…',
] as const

type StepProps = {
  number: number
  title: string
  description: string
  isLast?: boolean
  isActive?: boolean
  children?: ReactNode
}

const Step = ({ number, title, description, isLast = false, isActive = false, children }: StepProps) => (
  <li
    className={cn('relative grid grid-cols-[1.5rem_1fr] gap-x-4 pb-7', {
      'pb-0': isLast,
      'after:absolute after:top-8 after:bottom-1 after:left-3 after:w-px after:bg-border/60':
        !isLast,
    })}
  >
    <span
      aria-hidden
      className={cn(
        'flex size-6 items-center justify-center rounded-full border text-xs font-medium',
        {
          'border-border text-muted-foreground': !isActive,
          'border-primary/30 bg-primary/10 text-primary': isActive,
        },
      )}
    >
      {number}
    </span>
    <div className="flex min-w-0 flex-col gap-1 pt-0.5">
      <Text as="span" className="font-medium">
        {title}
      </Text>
      <Text as="span" variant="secondary" className="leading-5">
        {description}
      </Text>
      {children}
    </div>
  </li>
)

const RecordLine = ({ label, value }: { label: string; value: string }) => (
  <div className="grid grid-cols-[5rem_1fr] items-center gap-2">
    <Text as="span" variant="micro" className="font-medium tracking-wider text-muted-foreground/80 uppercase">
      {label}
    </Text>
    <span className="flex min-w-0 items-center gap-1">
      <span className="flex min-w-0 font-mono text-[0.8125rem]">
        <MiddleTruncate value={value} />
      </span>
      <CopyButton value={value} label={`Copy record ${label.toLowerCase()}`} className="text-muted-foreground" />
    </span>
  </div>
)

type VerifyStepsProps = {
  domainId: string
  recordValue: string
  recordName: string
  challengeHost: string
  detectedProviderId: string | null
}

export const VerifySteps = ({
  domainId,
  recordValue,
  recordName,
  challengeHost,
  detectedProviderId,
}: VerifyStepsProps) => {
  const selectId = useId()
  const [isChecking, startTransition] = useTransition()
  const [nextCheckAt, setNextCheckAt] = useState(() => Date.now() + pollDelaySeconds(0) * SECOND_MS)
  const [failureCount, setFailureCount] = useState(0)
  const [phaseIndex, setPhaseIndex] = useState(0)
  const [cooldownMessage, setCooldownMessage] = useState<string | null>(null)
  const [providerId, setProviderId] = useState(detectedProviderId ?? OTHER_PROVIDER_ID)
  const provider = findDnsProvider(providerId)

  useEffect(() => {
    if (!isChecking) return
    const timer = setInterval(
      () => setPhaseIndex((current) => (current + 1) % CHECK_PHASES.length),
      PHASE_ROTATION_MS,
    )
    return () => clearInterval(timer)
  }, [isChecking])

  useEffect(() => {
    if (isChecking) return
    const delayMs = Math.max(nextCheckAt - Date.now(), 0)
    const timer = setTimeout(() => {
      if (document.visibilityState === 'hidden') return
      startTransition(async () => {
        setPhaseIndex(0)
        let isPollHealthy = false
        try {
          const result = await pollDomainAction(domainId)
          isPollHealthy = result.ok || result.error.code === 'cooldown'
        } catch {
          isPollHealthy = false
        }
        const nextFailureCount = isPollHealthy ? 0 : failureCount + 1
        setFailureCount(nextFailureCount)
        setNextCheckAt(Date.now() + pollDelaySeconds(nextFailureCount) * SECOND_MS)
      })
    }, delayMs)
    return () => clearTimeout(timer)
  }, [nextCheckAt, isChecking, failureCount, domainId, startTransition])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return
      setNextCheckAt((current) => (current <= Date.now() ? Date.now() : current))
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  const handleVerify = () => {
    setCooldownMessage(null)
    setPhaseIndex(0)
    startTransition(async () => {
      try {
        const result = await verifyDomainAction(domainId)
        if (!result.ok && result.error.code === 'cooldown') {
          setCooldownMessage(result.error.message)
        }
      } catch {
        setCooldownMessage(null)
      }
      setFailureCount(0)
      setNextCheckAt(Date.now() + pollDelaySeconds(0) * SECOND_MS)
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <SectionContent>
        <SectionToolbar>
          <Text
            as="span"
            aria-live="polite"
            className="flex min-h-8 items-center gap-2 text-muted-foreground tabular-nums"
          >
            {isChecking ? (
              <>
                <Spinner />
                {CHECK_PHASES[phaseIndex]}
              </>
            ) : (
              <PollCountdown key={nextCheckAt} deadline={nextCheckAt} />
            )}
          </Text>
          <GhostButton
            icon={RefreshCwIcon}
            onClick={handleVerify}
            disabled={isChecking}
            className="-mr-2.5"
          >
            Check now
          </GhostButton>
        </SectionToolbar>
        <ol className="flex flex-col px-5 py-5">
          <Step
            number={1}
            title="Open your DNS provider"
            description="Pick yours to get the exact field names it uses."
          >
            <div className="mt-2 flex flex-wrap items-center gap-1">
              <ProviderSelect id={selectId} value={providerId} onValueChange={setProviderId} />
              {provider && (
                <GhostButton
                  icon={ExternalLinkIcon}
                  iconPosition="trailing"
                  href={provider.dashboardUrl}
                  isExternal
                >
                  Open dashboard
                </GhostButton>
              )}
            </div>
          </Step>
          <Step
            number={2}
            title="Add this TXT record"
            description="Most providers append your domain automatically — paste just the prefix."
          >
            <div className="mt-2 flex flex-col gap-1.5 rounded-lg border border-border/50 bg-muted/40 px-3.5 py-3">
              <RecordLine label={provider?.hostFieldName ?? 'Host'} value={recordName} />
              <RecordLine label={provider?.valueFieldName ?? 'Value'} value={recordValue} />
            </div>
          </Step>
          <Step
            number={3}
            title="Wait for us to spot it"
            description="We query your nameservers every 30 seconds. Propagation usually takes under a minute."
            isActive
            isLast
          >
            <TerminalCheck challengeHost={challengeHost} />
          </Step>
        </ol>
      </SectionContent>
      {cooldownMessage && (
        <AlertBanner tone="destructive" icon={ClockIcon}>
          {cooldownMessage}
        </AlertBanner>
      )}
    </div>
  )
}
