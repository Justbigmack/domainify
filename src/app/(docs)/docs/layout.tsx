import type { Metadata } from 'next'
import type { PropsWithChildren } from 'react'
import { DocsMobileNav } from '@/app/(docs)/docs/_components/DocsMobileNav'
import { DocsSidebar } from '@/app/(docs)/docs/_components/DocsSidebar'

export const metadata: Metadata = {
  title: {
    default: 'Documentation',
    template: '%s · Domainify Docs',
  },
}

const DocsLayout = ({ children }: PropsWithChildren) => (
  <div className="flex min-h-dvh">
    <DocsSidebar />
    <div className="flex min-w-0 flex-1 flex-col">
      <DocsMobileNav />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  </div>
)

export default DocsLayout
