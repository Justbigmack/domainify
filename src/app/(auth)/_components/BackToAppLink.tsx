import Link from 'next/link'
import { ChevronLeftIcon } from 'lucide-react'

export const BackToAppLink = () => (
  <Link
    href="/domains"
    className="inline-flex items-center gap-1 rounded-md text-sm text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
  >
    <ChevronLeftIcon aria-hidden className="size-3.5 shrink-0" />
    Back to app
  </Link>
)
