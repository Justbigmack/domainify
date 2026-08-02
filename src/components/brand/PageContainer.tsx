import type { HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const pageContainerVariants = cva('mx-auto flex w-full flex-col px-6 py-8 lg:px-10', {
  variants: {
    gap: {
      none: '',
      md: 'gap-6',
      lg: 'gap-8',
    },
    width: {
      default: 'max-w-6xl',
      narrow: 'max-w-3xl',
    },
    height: {
      auto: '',
      fill: 'flex-1',
    },
  },
  defaultVariants: {
    gap: 'md',
    width: 'default',
    height: 'auto',
  },
})

type PageContainerProps = HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof pageContainerVariants>

export const PageContainer = ({ gap, width, height, className, ...props }: PageContainerProps) => (
  <div className={cn(pageContainerVariants({ gap, width, height }), className)} {...props} />
)
