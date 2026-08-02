import type { PropsWithChildren } from 'react'
import { BrandLockup } from '@/components/brand/BrandLockup'

export const AuthPanel = ({ children }: PropsWithChildren) => (
  <div className="flex min-h-dvh items-center justify-center bg-background p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-8">
    <main className="flex min-h-[min(56rem,90dvh)] w-full max-w-[88rem] flex-col rounded-2xl border border-border/40 bg-card px-8 py-8 shadow-xs sm:px-12">
      <BrandLockup />
      <div className="flex flex-1 items-center justify-center py-12">
        <div className="w-full max-w-[28rem]">{children}</div>
      </div>
    </main>
  </div>
)
