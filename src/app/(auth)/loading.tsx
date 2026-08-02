import { Skeleton } from '@/components/ui/skeleton'

const AuthLoading = () => (
  <div aria-busy className="flex w-full flex-col gap-2.5">
    <Skeleton className="mx-auto h-7 w-56 rounded-lg" />
    <Skeleton className="mx-auto mb-4 h-5 w-64 rounded-lg" />
    <Skeleton className="h-11 w-full rounded-lg" />
    <Skeleton className="h-11 w-full rounded-lg" />
    <Skeleton className="mt-1 h-11 w-full rounded-md" />
  </div>
)

export default AuthLoading
