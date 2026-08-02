'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useSidebar } from '@/components/brand/Sidebar'

export const UserMenuSkeleton = () => {
  const { isCollapsed } = useSidebar()

  return (
    <div aria-busy className="flex h-9 w-full items-center gap-2 px-2">
      <Skeleton className="size-6 shrink-0 rounded-full" />
      <Skeleton
        className={cn(
          'h-4 flex-1 transition-opacity duration-200 ease-in-out motion-reduce:transition-none',
          { 'opacity-0': isCollapsed },
        )}
      />
    </div>
  )
}
