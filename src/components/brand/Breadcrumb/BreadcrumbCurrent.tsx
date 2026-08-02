import { Text } from '@/components/brand/Text'

type BreadcrumbCurrentProps = {
  label: string
}

export const BreadcrumbCurrent = ({ label }: BreadcrumbCurrentProps) => (
  <Text
    as="span"
    aria-current="page"
    className="min-w-0 truncate text-[0.8125rem] font-medium text-foreground"
    title={label}
  >
    {label}
  </Text>
)
