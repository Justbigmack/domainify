import type { PropsWithChildren, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Heading } from '@/components/brand/Heading'
import { Text } from '@/components/brand/Text'

type AuthNoticeProps = PropsWithChildren<{
  icon: LucideIcon
  title: string
  description: ReactNode
}>

export const AuthNotice = ({ icon: Icon, title, description, children }: AuthNoticeProps) => (
  <div className="flex flex-col items-center text-center">
    <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
      <Icon aria-hidden className="size-[1.125rem]" />
    </span>
    <Heading as="h1" size="h2" className="mt-4">
      {title}
    </Heading>
    <Text className="mt-1.5 leading-6 text-muted-foreground">{description}</Text>
    <div className="mt-6 flex w-full flex-col gap-2">{children}</div>
  </div>
)
