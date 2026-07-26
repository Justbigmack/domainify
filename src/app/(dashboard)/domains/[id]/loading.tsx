const DomainDetailLoading = () => (
  <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-8 lg:px-10" aria-busy>
    <div className="flex flex-col gap-5">
      <div className="h-5 w-20 rounded-md bg-surface-muted motion-safe:animate-pulse" />
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-xl bg-surface-muted motion-safe:animate-pulse" />
        <div className="flex flex-col gap-2">
          <div className="h-3 w-16 rounded bg-surface-muted motion-safe:animate-pulse" />
          <div className="h-6 w-52 rounded bg-surface-muted motion-safe:animate-pulse" />
        </div>
      </div>
      <div className="h-12 w-full max-w-md rounded-lg bg-surface-muted motion-safe:animate-pulse" />
    </div>
    <div className="h-32 rounded-xl bg-surface-muted motion-safe:animate-pulse" />
    <div className="h-44 rounded-xl bg-surface-muted motion-safe:animate-pulse" />
    <div className="h-36 rounded-xl bg-surface-muted motion-safe:animate-pulse" />
    <p className="text-center text-sm text-ink-muted">Running a fresh ownership check…</p>
  </div>
)

export default DomainDetailLoading
