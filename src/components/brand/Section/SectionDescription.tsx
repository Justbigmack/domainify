import type { PropsWithChildren } from 'react'
import { Text } from '@/components/brand/Text'
import { cn } from '@/lib/utils'

type SectionDescriptionProps = PropsWithChildren<{
  tone?: 'default' | 'destructive'
  className?: string
}>

export const SectionDescription = ({
  tone = 'default',
  className,
  children,
}: SectionDescriptionProps) => (
  <Text
    as="div"
    variant="secondary"
    className={cn('tabular-nums', { 'text-destructive/80': tone === 'destructive' }, className)}
  >
    {children}
  </Text>
)
