import type { HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const headingVariants = cva('text-balance text-foreground', {
  variants: {
    size: {
      h1: 'text-2xl leading-tight font-semibold tracking-tight',
      h2: 'text-xl leading-tight font-semibold tracking-tight',
      h3: 'text-sm font-semibold',
      h4: 'text-sm font-medium',
    },
  },
})

type HeadingLevel = 'h1' | 'h2' | 'h3' | 'h4'

type HeadingProps = HTMLAttributes<HTMLHeadingElement> &
  VariantProps<typeof headingVariants> & {
    as: HeadingLevel
  }

export const Heading = ({ as, size, className, ...props }: HeadingProps) => {
  const Tag = as
  return <Tag className={cn(headingVariants({ size: size ?? as }), className)} {...props} />
}
