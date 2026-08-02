import { Text } from '@/components/brand/Text'
import { cn } from '@/lib/utils'

const BRAND_YELLOW = '#F7DA5B'
const BRAND_INK = '#2A2725'

type BrandLockupProps = {
  className?: string
  markClassName?: string
  hasWordmark?: boolean
}

export const BrandLockup = ({
  className,
  markClassName,
  hasWordmark = true,
}: BrandLockupProps) => (
  <span className={cn('inline-flex select-none items-center gap-2', className)}>
    <svg viewBox="0 0 64 64" aria-hidden className={cn('size-6 shrink-0', markClassName)}>
      <rect width="64" height="64" rx="18" fill={BRAND_YELLOW} />
      <rect
        x="20.5"
        y="15"
        width="8"
        height="34"
        rx="4"
        fill={BRAND_INK}
        transform="rotate(20 24.5 32)"
      />
      <rect
        x="35.5"
        y="15"
        width="8"
        height="34"
        rx="4"
        fill={BRAND_INK}
        transform="rotate(20 39.5 32)"
      />
    </svg>
    {hasWordmark ? (
      <Text as="span" className="text-base font-semibold tracking-tight">
        domainify
      </Text>
    ) : null}
  </span>
)
