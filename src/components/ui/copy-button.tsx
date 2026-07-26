'use client'

import { useEffect, useState } from 'react'
import { CheckIcon, CopyIcon } from '@/components/icons'
import { cn } from '@/lib/cn'

const COPY_FEEDBACK_MS = 1500

type CopyButtonProps = {
  value: string
  label: string
  className?: string
}

export const CopyButton = ({ value, label, className }: CopyButtonProps) => {
  const [hasCopied, setHasCopied] = useState(false)

  useEffect(() => {
    if (!hasCopied) return
    const timer = setTimeout(() => setHasCopied(false), COPY_FEEDBACK_MS)
    return () => clearTimeout(timer)
  }, [hasCopied])

  const handleCopy = () => {
    void navigator.clipboard.writeText(value)
    setHasCopied(true)
  }

  return (
    <button
      type="button"
      aria-label={hasCopied ? 'Copied' : label}
      onClick={handleCopy}
      className={cn(
        'inline-flex size-7 shrink-0 items-center justify-center rounded-md text-ink-subtle transition-colors hover:bg-surface-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
        { 'text-success hover:text-success': hasCopied },
        className,
      )}
    >
      {hasCopied ? <CheckIcon className="size-3.5" /> : <CopyIcon className="size-3.5" />}
    </button>
  )
}
