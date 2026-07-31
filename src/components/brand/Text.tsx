import type { HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const textVariants = cva('', {
  variants: {
    variant: {
      body: 'text-sm text-foreground',
      secondary: 'text-[0.8125rem] text-muted-foreground',
      caption: 'text-xs text-muted-foreground',
      micro: 'text-[0.6875rem] text-muted-foreground',
    },
  },
  defaultVariants: {
    variant: 'body',
  },
})

type TextElement = 'p' | 'span' | 'div'

type TextProps = HTMLAttributes<HTMLElement> &
  VariantProps<typeof textVariants> & {
    as?: TextElement
  }

export const Text = ({ as = 'p', variant, className, ...props }: TextProps) => {
  const Tag = as
  return <Tag className={cn(textVariants({ variant }), className)} {...props} />
}
