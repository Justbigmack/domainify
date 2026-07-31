'use client'

import { useEffect, useState } from 'react'
import { CheckIcon, CopyIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const COPY_FEEDBACK_MS = 1000

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

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setHasCopied(true)
    } catch {
      return
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon-xs"
      onClick={handleCopy}
      aria-label={hasCopied ? 'Copied' : label}
      className={cn(
        'relative duration-200 active:scale-[0.97] motion-reduce:transition-none',
        className,
      )}
    >
      <span
        className={cn('transition-[scale,filter] duration-150 ease-out motion-reduce:transition-none', {
          'scale-0 blur-sm': hasCopied,
          'scale-100 blur-0': !hasCopied,
        })}
      >
        <CopyIcon />
      </span>
      <span
        className={cn(
          'absolute transition-[scale,filter] duration-150 ease-out motion-reduce:transition-none',
          {
            'scale-100 blur-0': hasCopied,
            'scale-0 blur-sm': !hasCopied,
          },
        )}
      >
        <CheckIcon />
      </span>
    </Button>
  )
}
