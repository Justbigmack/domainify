import { PageContainer } from '@/components/brand/PageContainer'
import { Skeleton } from '@/components/ui/skeleton'

const AddDomainRecordLoading = () => (
  <PageContainer aria-busy>
    <div className="flex flex-col gap-2">
      <Skeleton className="h-5 w-20" />
      <Skeleton className="h-7 w-40" />
    </div>
    <Skeleton className="h-14 w-full max-w-md rounded-xl" />
    <Skeleton className="h-48 rounded-xl" />
    <Skeleton className="h-32 rounded-xl" />
    <p className="text-center text-sm text-muted-foreground">Checking your DNS record…</p>
  </PageContainer>
)

export default AddDomainRecordLoading
