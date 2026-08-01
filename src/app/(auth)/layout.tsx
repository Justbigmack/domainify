import type { PropsWithChildren } from 'react'
import { Text } from '@/components/brand/Text'

const AuthLayout = ({ children }: PropsWithChildren) => (
  <main className="flex min-h-dvh flex-col items-center justify-center gap-8 px-6 py-12">
    <Text as="span" className="text-base font-semibold tracking-tight">
      Domainify
    </Text>
    {children}
  </main>
)

export default AuthLayout
