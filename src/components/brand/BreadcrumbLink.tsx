import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type BreadcrumbLinkProps = {
  href: string
  label: string
  icon: LucideIcon
  className?: string
}

export const BreadcrumbLink = ({ href, label, icon: Icon, className }: BreadcrumbLinkProps) => (
  <Link
    href={href}
    className={cn(
      '-ml-2 inline-flex h-8 w-fit shrink-0 items-center gap-1.5 rounded-[min(var(--radius-md),10px)] px-2 text-[0.8125rem] font-medium text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50',
      className,
    )}
  >
    <Icon aria-hidden strokeWidth={1.5} className="size-4 shrink-0" />
    {label}
  </Link>
)
