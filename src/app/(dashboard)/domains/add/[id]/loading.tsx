import { Skeleton } from '@/components/ui/skeleton'

const AddDomainRecordLoading = () => (
  <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-8 lg:px-10" aria-busy>
    <div className="flex flex-col gap-2">
      <Skeleton className="h-5 w-20" />
      <Skeleton className="h-7 w-40" />
    </div>
    <Skeleton className="h-14 w-full max-w-md rounded-xl" />
    <Skeleton className="h-48 rounded-xl" />
    <Skeleton className="h-32 rounded-xl" />
    <p className="text-center text-sm text-muted-foreground">Checking your DNS record…</p>
  </div>
)

export default AddDomainRecordLoading
