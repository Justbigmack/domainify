import type { PropsWithChildren } from 'react'

const AuthLayout = ({ children }: PropsWithChildren) => (
  <main className="flex min-h-dvh flex-col items-center justify-center gap-8 px-6 py-12">
    <span className="text-base font-semibold tracking-tight">Domainify</span>
    {children}
  </main>
)

export default AuthLayout
