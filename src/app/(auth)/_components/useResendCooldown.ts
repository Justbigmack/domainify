'use client'

import { useEffect, useState } from 'react'

export const RESEND_COOLDOWN_SECONDS = 30
const SECOND_MS = 1000

export const useResendCooldown = (initialSeconds = 0) => {
  const [cooldownSeconds, setCooldownSeconds] = useState(initialSeconds)
  const isCoolingDown = cooldownSeconds > 0

  useEffect(() => {
    if (!isCoolingDown) return
    const timer = setInterval(
      () => setCooldownSeconds((current) => Math.max(0, current - 1)),
      SECOND_MS,
    )
    return () => clearInterval(timer)
  }, [isCoolingDown])

  const startCooldown = () => setCooldownSeconds(RESEND_COOLDOWN_SECONDS)
  const clearCooldown = () => setCooldownSeconds(0)

  return { cooldownSeconds, isCoolingDown, startCooldown, clearCooldown }
}
