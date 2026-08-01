import Link from 'next/link'
import { ChevronLeftIcon } from 'lucide-react'

type BackToAppLinkProps = {
  onNavigate?: () => void
}

export const BackToAppLink = ({ onNavigate }: BackToAppLinkProps) => (
  <Link
    href="/domains"
    onClick={onNavigate}
    className="-ml-2.5 inline-flex h-8 w-fit touch-manipulation items-center gap-1 rounded-[min(var(--radius-md),10px)] px-2.5 text-[0.8125rem] font-normal text-muted-foreground transition-colors outline-none hover:bg-sidebar-accent/60 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
  >
    <ChevronLeftIcon aria-hidden strokeWidth={1.5} className="size-3.5 shrink-0" />
    Back to app
  </Link>
)
