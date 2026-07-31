'use client'

import { useEffect, useId, useState, useTransition } from 'react'
import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { ClockIcon, ExternalLinkIcon, RefreshCwIcon } from 'lucide-react'
import { GhostButton } from '@/components/brand/GhostButton'
import { Settings } from '@/components/brand/Settings'
import {
  OTHER_PROVIDER_ID,
  ProviderSelect,
  findDnsProvider,
} from '@/components/domains/ProviderSelect'
import { TerminalCheck } from '@/components/domains/TerminalCheck'
import { CopyButton } from '@/components/ui/copy-button'
import { Spinner } from '@/components/ui/spinner'
import { pollDomainAction, verifyDomainAction } from '@/lib/domains/actions'
import { cn } from '@/lib/utils'

const POLL_INTERVAL_SECONDS = 30
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
      <span className="text-sm font-medium">{title}</span>
      <span className="text-[0.8125rem] leading-5 text-muted-foreground">{description}</span>
      {children}
    </div>
  </li>
)

const TAIL_KEEP_LENGTH = 8

const MiddleTruncate = ({ value }: { value: string }) => {
  if (value.length <= TAIL_KEEP_LENGTH) {
    return <span title={value}>{value}</span>
  }
  return (
    <span className="flex min-w-0" title={value}>
      <span className="truncate">{value.slice(0, -TAIL_KEEP_LENGTH)}</span>
      <span className="shrink-0">{value.slice(-TAIL_KEEP_LENGTH)}</span>
    </span>
  )
}

const RecordLine = ({ label, value }: { label: string; value: string }) => (
  <div className="grid grid-cols-[5rem_1fr] items-center gap-2">
    <span className="text-[0.6875rem] font-medium tracking-wider text-muted-foreground/80 uppercase">
      {label}
    </span>
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
  const router = useRouter()
  const [isChecking, startTransition] = useTransition()
  const [countdownSeconds, setCountdownSeconds] = useState(POLL_INTERVAL_SECONDS)
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
    const timer = setInterval(
      () => setCountdownSeconds((current) => (current > 0 ? current - 1 : current)),
      SECOND_MS,
    )
    return () => clearInterval(timer)
  }, [isChecking])

  useEffect(() => {
    if (countdownSeconds !== 0 || isChecking) return
    startTransition(async () => {
      setPhaseIndex(0)
      await pollDomainAction(domainId)
      router.refresh()
      setCountdownSeconds(POLL_INTERVAL_SECONDS)
    })
  }, [countdownSeconds, isChecking, domainId, router, startTransition])

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
    <div className="flex flex-col gap-3">
      <Settings.Content>
        <Settings.Toolbar>
          <span
            aria-live="polite"
            className="flex min-h-8 items-center gap-2 text-sm text-muted-foreground tabular-nums"
          >
            {isChecking ? (
              <>
                <Spinner />
                {CHECK_PHASES[phaseIndex]}
              </>
            ) : (
              `Next check in ${countdownSeconds}s`
            )}
          </span>
          <GhostButton
            icon={RefreshCwIcon}
            onClick={handleVerify}
            disabled={isChecking}
            className="-mr-2.5"
          >
            Check now
          </GhostButton>
        </Settings.Toolbar>
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
      </Settings.Content>
      {cooldownMessage && (
        <Settings.Alert tone="warning" icon={ClockIcon}>
          {cooldownMessage}
        </Settings.Alert>
      )}
    </div>
  )
}
