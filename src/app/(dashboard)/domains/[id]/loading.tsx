import { Skeleton } from '@/components/ui/skeleton'

const SectionSkeleton = ({ cardHeightClass }: { cardHeightClass: string }) => (
  <div className="flex flex-col gap-3">
    <div className="flex flex-col gap-1.5 px-5">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-3.5 w-72" />
    </div>
    <Skeleton className={`${cardHeightClass} rounded-xl`} />
  </div>
)

const DomainDetailLoading = () => (
  <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-8 lg:px-10" aria-busy>
    <div className="flex flex-col px-5">
      <div className="flex h-8 items-center">
        <Skeleton className="h-4 w-40" />
      </div>
      <Skeleton className="mt-6 size-12 rounded-xl" />
      <Skeleton className="mt-4 h-9 w-72" />
      <Skeleton className="mt-1 h-5 w-64" />
    </div>
    <Skeleton className="h-12 rounded-lg" />
    <SectionSkeleton cardHeightClass="h-28" />
    <SectionSkeleton cardHeightClass="h-32" />
    <p className="text-center text-sm text-muted-foreground">Running a fresh ownership check…</p>
  </div>
)

export default DomainDetailLoading
