import { PageContainer } from '@/components/brand/PageContainer'
import { Skeleton } from '@/components/ui/skeleton'

const SKELETON_ROW_COUNT = 5

const DomainsLoading = () => (
  <PageContainer aria-busy>
    <div className="flex items-center justify-between gap-4 pl-5">
      <Skeleton className="h-7 w-32" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-9 w-20 rounded-md" />
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>
    </div>
    <div className="flex items-center gap-3">
      <Skeleton className="h-10 flex-1 rounded-lg" />
      <Skeleton className="h-10 w-28 rounded-lg" />
    </div>
    <div className="flex flex-col divide-y divide-border/50 rounded-xl border border-border/50 bg-card">
      {Array.from({ length: SKELETON_ROW_COUNT }, (_, index) => (
        <div key={index} className="flex h-14 items-center justify-between px-5">
          <Skeleton className="h-4 w-52" />
          <div className="flex items-center gap-8">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-12" />
          </div>
        </div>
      ))}
    </div>
  </PageContainer>
)

export default DomainsLoading
