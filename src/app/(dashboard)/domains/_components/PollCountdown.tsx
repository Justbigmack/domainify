'use client'

import { useEffect, useState } from 'react'

const SECOND_MS = 1000

const toRemainingSeconds = (deadline: number): number =>
  Math.max(Math.ceil((deadline - Date.now()) / SECOND_MS), 0)

type PollCountdownProps = {
  deadline: number
}

export const PollCountdown = ({ deadline }: PollCountdownProps) => {
  const [remainingSeconds, setRemainingSeconds] = useState(() => toRemainingSeconds(deadline))

  useEffect(() => {
    const timer = setInterval(
      () => setRemainingSeconds(toRemainingSeconds(deadline)),
      SECOND_MS,
    )
    return () => clearInterval(timer)
  }, [deadline])

  return <>Next check in {remainingSeconds}s</>
}
