import type { PropsWithChildren, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Heading } from '@/components/brand/Heading'
import { Text } from '@/components/brand/Text'
import { cn } from '@/lib/utils'

const pageStateVariants = cva('flex w-full items-center justify-center px-6 py-12 lg:px-10', {
  variants: {
    height: {
      fill: 'flex-1',
      viewport: 'min-h-dvh',
    },
  },
  defaultVariants: {
    height: 'fill',
  },
})

const TONE_CLASSES = {
  neutral: 'border-border/60 bg-muted text-muted-foreground',
  destructive: 'border-destructive/20 bg-destructive/[0.06] text-destructive',
} as const

type PageStateTone = keyof typeof TONE_CLASSES

type PageStateProps = PropsWithChildren<
  VariantProps<typeof pageStateVariants> & {
    icon: LucideIcon
    tone?: PageStateTone
    title: string
    action?: ReactNode
    footer?: ReactNode
    className?: string
  }
>

export const PageState = ({
  icon: Icon,
  tone = 'neutral',
  height,
  title,
  action,
  footer,
  className,
  children,
}: PageStateProps) => (
  <div className={cn(pageStateVariants({ height }), className)}>
    <div className="flex w-full max-w-sm flex-col items-center gap-5 text-center">
      <div
        className={cn(
          'flex size-10 items-center justify-center rounded-lg border',
          TONE_CLASSES[tone],
        )}
      >
        <Icon className="size-5" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Heading as="h1" size="h2">
          {title}
        </Heading>
        <Text variant="secondary" className="text-balance">
          {children}
        </Text>
      </div>
      {action}
      {footer}
    </div>
  </div>
)
