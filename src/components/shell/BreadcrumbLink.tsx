import Link from 'next/link'
import { ChevronLeftIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type BreadcrumbLinkProps = {
  href: string
  label: string
  className?: string
}

export const BreadcrumbLink = ({ href, label, className }: BreadcrumbLinkProps) => (
  <Link
    href={href}
    className={cn(
      '-ml-2.5 inline-flex h-8 w-fit items-center gap-1 rounded-[min(var(--radius-md),10px)] px-2.5 text-[0.8125rem] font-normal text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50',
      className,
    )}
  >
    <ChevronLeftIcon aria-hidden strokeWidth={1.5} className="size-3.5 shrink-0" />
    {label}
  </Link>
)
