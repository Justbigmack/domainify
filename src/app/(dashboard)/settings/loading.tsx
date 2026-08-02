import { Skeleton } from '@/components/ui/skeleton'

const SettingsLoading = () => (
  <div className="flex flex-col gap-8" aria-busy>
    <div className="pl-5">
      <Skeleton className="h-7 w-28" />
    </div>
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 pl-5">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-24 rounded-xl" />
    </div>
  </div>
)

export default SettingsLoading
