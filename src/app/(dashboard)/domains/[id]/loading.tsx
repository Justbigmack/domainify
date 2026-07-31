import { Skeleton } from '@/components/ui/skeleton'

const DomainDetailLoading = () => (
  <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-8 lg:px-10" aria-busy>
    <div className="flex flex-col gap-5">
      <Skeleton className="h-5 w-20" />
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-xl" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-6 w-52" />
        </div>
      </div>
      <Skeleton className="h-12 w-full max-w-md rounded-lg" />
    </div>
    <Skeleton className="h-32 rounded-xl" />
    <Skeleton className="h-44 rounded-xl" />
    <Skeleton className="h-36 rounded-xl" />
    <p className="text-center text-sm text-muted-foreground">Running a fresh ownership check…</p>
  </div>
)

export default DomainDetailLoading
