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
  },
  defaultVariants: {
    gap: 'md',
    width: 'default',
  },
})

type PageContainerProps = HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof pageContainerVariants>

export const PageContainer = ({ gap, width, className, ...props }: PageContainerProps) => (
  <div className={cn(pageContainerVariants({ gap, width }), className)} {...props} />
)
